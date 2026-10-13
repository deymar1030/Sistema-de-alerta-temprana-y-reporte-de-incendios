"""Orquesta un ClientePredio por predio para la interfaz web (hilos, un broker MQTT)."""
import os
import threading
import time
from collections import deque

from backend_api import ClienteBackend
from cliente_predio import ClientePredio


class SimuladorManager:
    def __init__(self):
        self.lock = threading.RLock()
        self.backend = None
        self.predios = {}      # id_predio -> dict descubierto (sensores, credenciales MQTT)
        self.clientes = {}     # id_predio -> ClientePredio
        self.errores = {}      # id_predio -> ultimo error de conexion
        self.logs = deque(maxlen=300)
        self.intervalo = 7

    def log(self, id_predio, msg):
        self.logs.appendleft({"t": time.strftime("%H:%M:%S"), "predio": id_predio, "msg": msg})

    def refrescar(self):
        """Login + descubrimiento en vivo (predios y sensores ACTIVOS del backend)."""
        with self.lock:
            self.backend = ClienteBackend(
                os.getenv("SIMULADOR_BACKEND_URL", "http://127.0.0.1:3000"),
                os.getenv("SIMULADOR_CORREO"), os.getenv("SIMULADOR_CONTRASENA"))
            self.predios = {p["id_predio"]: p for p in self.backend.descubrir_predios()}
            return len(self.predios)

    def iniciar(self, id_predio):
        with self.lock:
            if id_predio in self.clientes:
                return
            p = self.predios[id_predio]
            c = ClientePredio(id_predio, p["usuario_mqtt"], p["password_mqtt"], p["sensores"],
                              self.intervalo, semilla=42 + id_predio)
            c.on_log = self.log
            try:
                c.conectar()
            except Exception as e:  # noqa: BLE001 - se informa en la UI
                self.errores[id_predio] = str(e)
                self.log(id_predio, f"[ERROR] {e}")
                raise
            self.errores.pop(id_predio, None)
            c.iniciar_publicacion()
            self.clientes[id_predio] = c

    def detener(self, id_predio):
        with self.lock:
            c = self.clientes.pop(id_predio, None)
        if c:
            c.desconectar()
            self.log(id_predio, "[STOP] simulacion detenida")

    def evento(self, id_predio, tipo, intensidad=1.0, rampa=60):
        c = self.clientes.get(id_predio)
        if not c:
            raise ValueError("El predio no esta simulando; inicialo primero")
        c.iniciar_evento(tipo, intensidad, rampa)

    def apagar(self, id_predio):
        c = self.clientes.get(id_predio)
        if c:
            c.apagar_evento()

    def estado(self):
        out = []
        for id_predio, p in sorted(self.predios.items()):
            c = self.clientes.get(id_predio)
            ev = c.evento if c else None
            sensores = []
            for s in p["sensores"]:
                u = c.ultimos.get(s["id_sensor"]) if c else None
                sensores.append({"id": s["id_sensor"], "tipo": s["tipo_variable"], "unidad": s["unidad"],
                                 "valor": u["valor"] if u else None})
            out.append({
                "id_predio": id_predio, "activo": c is not None, "error": self.errores.get(id_predio),
                "segundos": int(time.time() - c.publicando_desde) if c and c.publicando_desde else 0,
                "evento": {"tipo": ev["tipo"], "apagando": ev["fin"] is not None} if ev else None,
                "sensores": sensores})
        return {"predios": out, "logs": list(self.logs)[:60], "intervalo": self.intervalo}

    def cerrar(self):
        for i in list(self.clientes):
            self.detener(i)
