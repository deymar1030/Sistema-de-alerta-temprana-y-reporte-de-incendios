"""Un cliente MQTT por predio; sensores originales, QoS 1 y sin retain."""
import json
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


# Efectos de un incendio manual: (tipo_sensor -> (absoluto, fraccion_del_rango)).
# Se escala por avance (0..1) e intensidad. Solo prueba de software, no fisica real.
EFECTOS = {
    "calor": {"TEMPERATURA": (25, 0)},
    "gas": {"CO2": (1800, 0), "GAS_LEL": (18, 0)},
    "incendio": {"TEMPERATURA": (45, 0), "CO2": (2500, 0), "HUMEDAD": (-15, 0),
                 "HUMO": (0, 0.5), "CO": (0, 0.3)},
    "pico": {},
}


def avance_evento(ev, ahora):
    """0..1 segun la rampa; tras apagar baja linealmente durante ev['decaimiento'] s."""
    a = min(1.0, (ahora - ev["inicio"]) / ev["rampa"])
    if ev["fin"] is not None:
        a *= max(0.0, 1 - (ahora - ev["fin"]) / ev["decaimiento"])
    return a


def aplicar_evento(sensor_cfg, valor, ev, ahora, es_primer_temp):
    if ev["tipo"] == "pico":
        if es_primer_temp and ahora - ev["inicio"] < 10:
            valor = sensor_cfg["rango_max"]
    else:
        absoluto, frac = EFECTOS[ev["tipo"]].get(sensor_cfg["tipo_variable"], (0, 0))
        span = sensor_cfg["rango_max"] - sensor_cfg["rango_min"]
        valor += (absoluto + frac * span) * ev["intensidad"] * avance_evento(ev, ahora)
    return round(max(sensor_cfg["rango_min"], min(sensor_cfg["rango_max"], valor)), 2)


def payload_hora(payload):
    return json.loads(payload)["fecha_hora"]


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
        self._conectado = threading.Event()
        self._respuesta = threading.Event()
        self._hilo = None
        self._error = None
        self.evento = None          # incendio manual activo (ver iniciar_evento)
        self.ultimos = {}           # id_sensor -> ultima lectura publicada
        self.on_log = None          # callback(id_predio, mensaje) para la interfaz
        self.publicando_desde = None
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

    def _log(self, msg, debug=False):
        print(msg)
        if self.on_log and not debug:
            self.on_log(self.id_predio, msg)

    def iniciar_evento(self, tipo, intensidad=1.0, rampa=60, decaimiento=45):
        if tipo not in EFECTOS:
            raise ValueError(f"Tipo de evento desconocido: {tipo}")
        self.evento = {"tipo": tipo, "intensidad": float(intensidad), "rampa": max(1.0, float(rampa)),
                       "decaimiento": max(1.0, float(decaimiento)), "inicio": time.monotonic(), "fin": None}
        self._log(f"[EVENTO] Predio {self.id_predio}: {tipo} (intensidad {intensidad}, rampa {rampa}s)")

    def apagar_evento(self):
        if self.evento and self.evento["fin"] is None:
            self.evento["fin"] = time.monotonic()
            self._log(f"[EVENTO] Predio {self.id_predio}: evento apagado, valores vuelven a la normalidad")

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        self._error = str(reason_code) if reason_code.is_failure else None
        if reason_code.is_failure:
            self._conectado.clear()
        else:
            self._conectado.set()
            self._log(f"[OK] Predio {self.id_predio} conectado ({len(self.sensores)} sensores)")
        self._respuesta.set()

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):
        self._conectado.clear()
        if not self._detener.is_set():
            self._log(f"[MQTT] Predio {self.id_predio} desconectado; reconectando")

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
        self.publicando_desde = time.time()
        temps = [x["id_sensor"] for x in self.sensores if x["tipo_variable"] == "TEMPERATURA"]
        while not self._detener.is_set():
            if not self._conectado.wait(1):
                continue
            ciclo = time.monotonic()
            for sensor in self.sensores:
                if self._detener.is_set() or not self._conectado.is_set():
                    break
                valor = generar_valor(sensor, self.rng, self.escenario, ciclo - inicio, self.inicio_evento, self.sensor_pico_id)
                ev = self.evento
                if ev:
                    if ev["fin"] is not None and avance_evento(ev, time.monotonic()) <= 0:
                        self.evento = ev = None
                    else:
                        valor = aplicar_evento(sensor, valor, ev, time.monotonic(), bool(temps) and sensor["id_sensor"] == temps[0])
                topico = f"incendios/{self.id_predio}/{sensor['id_sensor']}"
                payload = json.dumps({"valor": valor, "fecha_hora": datetime.now(timezone.utc).isoformat(timespec="milliseconds")})
                info = self.client.publish(topico, payload, qos=1, retain=False)
                if info.rc not in (mqtt.MQTT_ERR_SUCCESS, mqtt.MQTT_ERR_NO_CONN):
                    print(f"[ERROR] No se encolo lectura de {topico}: {info.rc}")
                    continue
                try:
                    info.wait_for_publish(timeout=10)
                    if info.is_published():
                        self.ultimos[sensor["id_sensor"]] = {"valor": valor, "hora": payload_hora(payload)}
                        self._log(f"[PUBACK] {topico} -> {payload} ({sensor['tipo_variable']}, {sensor['unidad']})", debug=True)
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
