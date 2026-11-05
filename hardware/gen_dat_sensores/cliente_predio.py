"""Un cliente MQTT por predio; sensores originales, QoS 1 y sin retain."""
import json
import math
import os
import random
import threading
import time
from collections import deque
from datetime import datetime, timezone
from urllib.parse import urlparse

import paho.mqtt.client as mqtt


INTERVALO_MIN_SEGUNDOS = 5
INTERVALO_MAX_SEGUNDOS = 60
INTERVALO_PREDETERMINADO_SEGUNDOS = 15
CO_INCENDIO_INCREMENTO_PPM = 100.0
CO_INCENDIO_INCREMENTO_INICIAL_PPM = 10.0
HUMEDAD_INCENDIO_MAX_PORCENTAJE = 19.0
HUMO_INCENDIO_MINIMO_PPM = 501.0

ESCENARIOS_MANUALES = {
    "gas": {
        "etiqueta": "Gas combustible (CO₂ y %LEL)",
        "descripcion": "Aumenta gradualmente CO₂ y %LEL durante 15 segundos; otras variables siguen su variación normal.",
    },
    "calor": {
        "etiqueta": "Calor (temperatura)",
        "descripcion": "Lleva las lecturas de temperatura a 80 °C desde la primera lectura del escenario. Las demás variables siguen su variación normal.",
    },
    "co": {
        "etiqueta": "Monóxido de carbono (CO)",
        "descripcion": "Aumenta CO desde la primera lectura y llega a un incremento sintético de 100 ppm en 10 segundos; las demás variables siguen su variación normal.",
    },
    "humo": {
        "etiqueta": "Humo",
        "descripcion": "Eleva el humo por encima de 500 ppm desde la primera lectura si el rango máximo del sensor lo permite; las demás variables siguen su variación normal.",
    },
    "humedad": {
        "etiqueta": "Baja humedad",
        "descripcion": "Reduce la humedad a 19 % desde la primera lectura si el rango mínimo del sensor lo permite; las demás variables siguen su variación normal.",
    },
    "incendio": {
        "etiqueta": "Incendio combinado (todas las variables)",
        "descripcion": "Combina temperatura (80 °C), CO₂, %LEL, CO, humo (>500 ppm) y humedad (<20 %) cuando los rangos de cada sensor lo permiten.",
    },
}


def generar_valor(sensor_cfg, rng=None, escenario="normal", segundos=0, inicio_evento=420, sensor_pico_id=None):
    rng = rng or random
    valor = sensor_cfg["valor_base"] + rng.gauss(0, sensor_cfg["sigma"])
    # Escenarios de prueba, no magnitudes fisicas calibradas ni evidencia de incendio.
    if segundos >= inicio_evento:
        duracion_rampa = {
            "gas": 15,
            "co": 10,
            "incendio": 10,
        }.get(escenario, 120)
        avance = min(1.0, (segundos - inicio_evento) / duracion_rampa)
        if escenario in {"gas", "incendio"} and sensor_cfg["tipo_variable"] in {"CO2", "GAS_LEL"}:
            valor += {"CO2": 1800, "GAS_LEL": 18}[sensor_cfg["tipo_variable"]] * avance
        if escenario in {"co", "incendio"} and sensor_cfg["tipo_variable"] == "CO":
            valor += CO_INCENDIO_INCREMENTO_INICIAL_PPM + (
                CO_INCENDIO_INCREMENTO_PPM - CO_INCENDIO_INCREMENTO_INICIAL_PPM
            ) * avance
        if escenario in {"humedad", "incendio"} and sensor_cfg["tipo_variable"] == "HUMEDAD":
            valor = min(valor, HUMEDAD_INCENDIO_MAX_PORCENTAJE)
        if escenario in {"humo", "incendio"} and sensor_cfg["tipo_variable"] == "HUMO":
            valor = max(valor, HUMO_INCENDIO_MINIMO_PPM)
        if escenario in {"calor", "incendio"} and sensor_cfg["tipo_variable"] == "TEMPERATURA":
            valor = max(valor, sensor_cfg.get("temperatura_escenario_max", valor))
        elif escenario == "pico" and sensor_cfg["id_sensor"] == sensor_pico_id and segundos - inicio_evento < 10:
            valor = sensor_cfg["rango_max"]
    return round(max(sensor_cfg["rango_min"], min(sensor_cfg["rango_max"], valor)), 2)


class ClientePredio:
    def __init__(self, id_predio, usuario_mqtt, password_mqtt, sensores,
                 intervalo_segundos=INTERVALO_PREDETERMINADO_SEGUNDOS,
                 broker_url=None, ca_file=None, escenario="normal", semilla=None, inicio_evento=420,
                 sensor_pico_id=None, nombre_predio=None):
        if not INTERVALO_MIN_SEGUNDOS <= intervalo_segundos <= INTERVALO_MAX_SEGUNDOS:
            raise ValueError(
                f"El intervalo debe estar entre {INTERVALO_MIN_SEGUNDOS} "
                f"y {INTERVALO_MAX_SEGUNDOS} segundos"
            )
        self.id_predio = id_predio
        self.nombre_predio = nombre_predio or f"Predio {id_predio}"
        self.sensores = sensores
        self.intervalo_segundos = intervalo_segundos
        self.escenario = escenario
        self.inicio_evento = inicio_evento
        self.sensor_pico_id = sensor_pico_id
        self.rng = random.Random(semilla)
        self._detener = threading.Event()
        self._lecturas_manuales_lock = threading.Lock()
        self._lecturas_manuales = {}
        self._sensores_publicacion_lock = threading.Lock()
        self._sensores_publicacion_habilitados = {
            sensor["id_sensor"]: True for sensor in sensores
        }
        self._escenario_manual_lock = threading.Lock()
        self._escenario_manual = None
        self._escenario_manual_inicio = None
        self._publicaciones_lock = threading.Lock()
        self._publicaciones = deque(maxlen=80)
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
        with self._sensores_publicacion_lock:
            if not self._sensores_publicacion_habilitados.get(id_sensor, False):
                raise ValueError("El envio de este sensor esta pausado; reanudalo antes de encolar una lectura")
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

    def configurar_publicacion_sensor(self, id_sensor, habilitado):
        if not isinstance(habilitado, bool):
            raise ValueError("El estado de publicacion debe ser verdadero o falso")
        if not any(sensor["id_sensor"] == id_sensor for sensor in self.sensores):
            raise ValueError("El sensor no pertenece a este predio o no esta activo")
        with self._sensores_publicacion_lock:
            self._sensores_publicacion_habilitados[id_sensor] = habilitado
            if not habilitado:
                with self._lecturas_manuales_lock:
                    self._lecturas_manuales.pop(id_sensor, None)
        return habilitado

    def configurar_publicacion_sensores(self, habilitado):
        if not isinstance(habilitado, bool):
            raise ValueError("El estado de publicacion debe ser verdadero o falso")
        with self._sensores_publicacion_lock:
            for id_sensor in self._sensores_publicacion_habilitados:
                self._sensores_publicacion_habilitados[id_sensor] = habilitado
            if not habilitado:
                with self._lecturas_manuales_lock:
                    self._lecturas_manuales.clear()
        return habilitado

    def publicacion_sensor_habilitada(self, id_sensor):
        with self._sensores_publicacion_lock:
            return self._sensores_publicacion_habilitados.get(id_sensor, False)

    def iniciar_escenario_manual(self, escenario):
        if escenario not in ESCENARIOS_MANUALES:
            raise ValueError("Selecciona un escenario valido")
        with self._escenario_manual_lock:
            self._escenario_manual = escenario
            self._escenario_manual_inicio = time.monotonic()
        return escenario

    def detener_escenario_manual(self):
        with self._escenario_manual_lock:
            escenario = self._escenario_manual
            self._escenario_manual = None
            self._escenario_manual_inicio = None
        return escenario

    def _estado_escenario_manual(self):
        with self._escenario_manual_lock:
            if self._escenario_manual is None:
                return None, 0
            return self._escenario_manual, time.monotonic() - self._escenario_manual_inicio

    @property
    def escenario_manual_activo(self):
        with self._escenario_manual_lock:
            return self._escenario_manual

    def publicaciones_recientes(self):
        with self._publicaciones_lock:
            return list(self._publicaciones)

    def _registrar_publicacion(self, sensor, valor, topico, estado, detalle=""):
        lectura = {
            "fecha_hora": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            "id_sensor": sensor["id_sensor"],
            "tipo_variable": sensor["tipo_variable"],
            "unidad": sensor["unidad"],
            "valor": valor,
            "topico": topico,
            "estado": estado,
            "detalle": detalle,
        }
        with self._publicaciones_lock:
            self._publicaciones.append(lectura)
        return lectura

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
            escenario_manual, segundos_escenario = self._estado_escenario_manual()
            for sensor in self.sensores:
                if self._detener.is_set() or not self._conectado.is_set():
                    break
                if not self.publicacion_sensor_habilitada(sensor["id_sensor"]):
                    continue
                valor_manual = self._lectura_manual_pendiente(sensor["id_sensor"])
                if valor_manual is not None:
                    valor = valor_manual
                elif escenario_manual:
                    valor = generar_valor(
                        sensor, self.rng, escenario_manual, segundos_escenario, 0,
                        self.sensor_pico_id
                    )
                else:
                    valor = generar_valor(
                        sensor, self.rng, self.escenario, ciclo - inicio,
                        self.inicio_evento, self.sensor_pico_id
                    )
                topico = f"incendios/{self.id_predio}/{sensor['id_sensor']}"
                payload = json.dumps({"valor": valor, "fecha_hora": datetime.now(timezone.utc).isoformat(timespec="milliseconds")})
                with self._sensores_publicacion_lock:
                    if not self._sensores_publicacion_habilitados.get(sensor["id_sensor"], False):
                        continue
                    info = self.client.publish(topico, payload, qos=1, retain=False)
                if info.rc not in (mqtt.MQTT_ERR_SUCCESS, mqtt.MQTT_ERR_NO_CONN):
                    detalle = f"codigo MQTT {info.rc}"
                    self._registrar_publicacion(sensor, valor, topico, "ERROR", detalle)
                    print(f"[ERROR] No se encolo lectura de {topico}: {info.rc}")
                    continue
                try:
                    info.wait_for_publish(timeout=10)
                    if info.is_published():
                        if valor_manual is not None:
                            self._confirmar_lectura_manual(sensor["id_sensor"], valor_manual)
                        origen = "manual" if valor_manual is not None else "simulado"
                        self._registrar_publicacion(sensor, valor, topico, "PUBACK", origen)
                        print(f"[PUBACK] {topico} -> {payload} ({origen}, {sensor['tipo_variable']}, {sensor['unidad']})")
                    else:
                        self._registrar_publicacion(sensor, valor, topico, "PENDIENTE", "Sin confirmacion QoS 1")
                        print(f"[MQTT] Lectura pendiente de confirmacion: {topico}")
                except RuntimeError:
                    self._registrar_publicacion(sensor, valor, topico, "PENDIENTE", "Sin confirmacion QoS 1")
                    print(f"[MQTT] Sin confirmacion de publicacion: {topico}")
            self._detener.wait(max(0, self.intervalo_segundos - (time.monotonic() - ciclo)))

    def iniciar_publicacion(self):
        if self._hilo and self._hilo.is_alive():
            return self._hilo
        self._hilo = threading.Thread(target=self._publicar, name=f"predio-{self.id_predio}", daemon=True)
        self._hilo.start()
        return self._hilo
