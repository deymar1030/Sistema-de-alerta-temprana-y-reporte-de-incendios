"""Un cliente MQTT por predio; sensores originales, QoS 1 y sin retain."""
import json
import math
import os
import random
import threading
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import paho.mqtt.client as mqtt


def generar_valor(sensor_cfg, rng=None, escenario="normal", segundos=0, inicio_evento=420, sensor_pico_id=None):
    rng = rng or random
    valor = sensor_cfg["valor_base"] + rng.gauss(0, sensor_cfg["sigma"])
    # Escenarios de prueba, no magnitudes fisicas calibradas ni evidencia de incendio.
    if segundos >= inicio_evento:
        avance = min(1.0, (segundos - inicio_evento) / 120)
        if escenario == "gas" and sensor_cfg["tipo_variable"] in {"CO2", "GAS_LEL"}:
            valor += {"CO2": 1800, "GAS_LEL": 18}[sensor_cfg["tipo_variable"]] * avance
        elif escenario == "calor" and sensor_cfg["tipo_variable"] == "TEMPERATURA":
            valor += 25 * avance
        elif escenario == "pico" and sensor_cfg["id_sensor"] == sensor_pico_id and segundos - inicio_evento < 10:
            valor = sensor_cfg["rango_max"]
    return round(max(sensor_cfg["rango_min"], min(sensor_cfg["rango_max"], valor)), 2)


class ClientePredio:
    def __init__(self, id_predio, usuario_mqtt, password_mqtt, sensores, intervalo_segundos=7,
                 broker_url=None, ca_file=None, escenario="normal", semilla=None, inicio_evento=420,
                 sensor_pico_id=None):
        if not 5 <= intervalo_segundos <= 10:
            raise ValueError("El intervalo debe estar entre 5 y 10 segundos")
        self.id_predio = id_predio
        self.sensores = sensores
        self.intervalo_segundos = intervalo_segundos
        self.escenario = escenario
        self.inicio_evento = inicio_evento
        self.sensor_pico_id = sensor_pico_id
        self.rng = random.Random(semilla)
        self._detener = threading.Event()
        self._lecturas_manuales_lock = threading.Lock()
        self._lecturas_manuales = {}
        self._conectado = threading.Event()
        self._respuesta = threading.Event()
        self._hilo = None
        self._error = None
        broker = urlparse(broker_url or os.getenv("MQTT_BROKER_URL", "mqtt://127.0.0.1:1883"))
        if broker.scheme not in ("mqtt", "mqtts") or not broker.hostname or broker.username or broker.password:
            raise ValueError("URL del broker invalida; credenciales separadas de la URL")
        self.host = broker.hostname
        self.port = broker.port or (8883 if broker.scheme == "mqtts" else 1883)
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"predio-{id_predio}",
                                  protocol=mqtt.MQTTv311, clean_session=True)
        self.client.username_pw_set(usuario_mqtt, password_mqtt)
        self.client.reconnect_delay_set(min_delay=1, max_delay=30)
        self.client.max_queued_messages_set(200)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        if broker.scheme == "mqtts":
            self.client.tls_set(ca_certs=ca_file or os.getenv("MQTT_CA_FILE") or None)
            self.client.tls_insecure_set(False)
        elif os.getenv("NODE_ENV") == "production":
            raise ValueError("MQTT requiere TLS en produccion")

    def programar_lectura_manual(self, id_sensor, valor):
        sensor = next((s for s in self.sensores if s["id_sensor"] == id_sensor), None)
        if sensor is None:
            raise ValueError("El sensor no pertenece a este predio o no esta activo")
        if isinstance(valor, bool):
            raise ValueError("El valor debe ser numerico y finito")
        try:
            valor = float(valor)
        except (TypeError, ValueError) as error:
            raise ValueError("El valor debe ser numerico y finito") from error
        if not math.isfinite(valor):
            raise ValueError("El valor debe ser numerico y finito")
        if not sensor["rango_min"] <= valor <= sensor["rango_max"]:
            raise ValueError(
                f"El valor debe estar entre {sensor['rango_min']} y {sensor['rango_max']}"
            )

        valor = round(valor, 4)
        if not sensor["rango_min"] <= valor <= sensor["rango_max"]:
            raise ValueError("El valor redondeado queda fuera del rango permitido")
        with self._lecturas_manuales_lock:
            if id_sensor in self._lecturas_manuales:
                raise ValueError("Ya hay una lectura manual pendiente para este sensor")
            self._lecturas_manuales[id_sensor] = valor
        return valor

    def _lectura_manual_pendiente(self, id_sensor):
        with self._lecturas_manuales_lock:
            return self._lecturas_manuales.get(id_sensor)

    def _confirmar_lectura_manual(self, id_sensor, valor):
        with self._lecturas_manuales_lock:
            if self._lecturas_manuales.get(id_sensor) == valor:
                del self._lecturas_manuales[id_sensor]

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        self._error = str(reason_code) if reason_code.is_failure else None
        if reason_code.is_failure:
            self._conectado.clear()
        else:
            self._conectado.set()
            print(f"[OK] Predio {self.id_predio} conectado ({len(self.sensores)} sensores)")
        self._respuesta.set()

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):
        self._conectado.clear()
        if not self._detener.is_set():
            print(f"[MQTT] Predio {self.id_predio} desconectado; reconectando")

    def conectar(self):
        self.client.connect(self.host, self.port, keepalive=30)
        self.client.loop_start()
        if not self._respuesta.wait(10) or not self._conectado.is_set():
            self.desconectar()
            raise ConnectionError(f"Predio {self.id_predio}: conexion rechazada o sin respuesta ({self._error or 'timeout'})")

    def desconectar(self):
        self._detener.set()
        if self._hilo:
            self._hilo.join(timeout=12)
        self.client.disconnect()
        self.client.loop_stop()

    def _publicar(self):
        inicio = time.monotonic()
        while not self._detener.is_set():
            if not self._conectado.wait(1):
                continue
            ciclo = time.monotonic()
            for sensor in self.sensores:
                if self._detener.is_set() or not self._conectado.is_set():
                    break
                valor_manual = self._lectura_manual_pendiente(sensor["id_sensor"])
                valor = valor_manual if valor_manual is not None else generar_valor(
                    sensor, self.rng, self.escenario, ciclo - inicio,
                    self.inicio_evento, self.sensor_pico_id
                )
                topico = f"incendios/{self.id_predio}/{sensor['id_sensor']}"
                payload = json.dumps({"valor": valor, "fecha_hora": datetime.now(timezone.utc).isoformat(timespec="milliseconds")})
                info = self.client.publish(topico, payload, qos=1, retain=False)
                if info.rc not in (mqtt.MQTT_ERR_SUCCESS, mqtt.MQTT_ERR_NO_CONN):
                    print(f"[ERROR] No se encolo lectura de {topico}: {info.rc}")
                    continue
                try:
                    info.wait_for_publish(timeout=10)
                    if info.is_published():
                        if valor_manual is not None:
                            self._confirmar_lectura_manual(sensor["id_sensor"], valor_manual)
                        origen = "manual" if valor_manual is not None else "simulado"
                        print(f"[PUBACK] {topico} -> {payload} ({origen}, {sensor['tipo_variable']}, {sensor['unidad']})")
                    else:
                        print(f"[MQTT] Lectura pendiente de confirmacion: {topico}")
                except RuntimeError:
                    print(f"[MQTT] Sin confirmacion de publicacion: {topico}")
            self._detener.wait(max(0, self.intervalo_segundos - (time.monotonic() - ciclo)))

    def iniciar_publicacion(self):
        if self._hilo and self._hilo.is_alive():
            return self._hilo
        self._hilo = threading.Thread(target=self._publicar, name=f"predio-{self.id_predio}", daemon=True)
        self._hilo.start()
        return self._hilo
