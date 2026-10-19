"""Cliente HTTP minimo: descubre predios/sensores reales del backend y
gestiona la credencial MQTT propia del simulador para cada predio nuevo.

No usa simuladores.json ni publishers.json: todo se consulta en vivo con
un usuario de simulacion (login normal del sistema) cada vez que corre.
"""
import json
import os
import secrets
from pathlib import Path

import requests

DIRECTORIO = Path(__file__).resolve().parent
CREDENCIALES_DEFAULT = DIRECTORIO / "runtime" / "credenciales_predios.json"

# Valores de referencia para iniciar el ruido de cada tipo de variable;
# se ajustan al rango real del sensor devuelto por el backend.
TIPO_DEFAULTS = {
    "TEMPERATURA": {"valor_base": 21.0, "sigma": 1.5},
    "HUMEDAD": {"valor_base": 50.0, "sigma": 4.0},
    "CO2": {"valor_base": 420.0, "sigma": 15.0},
    "GAS_LEL": {"valor_base": 2.0, "sigma": 0.6},
    "HUMO": {"valor_base": 5.0, "sigma": 1.0},
    "CO": {"valor_base": 1.0, "sigma": 0.3},
}


class ClienteBackend:
    def __init__(self, base_url, correo, contrasena, credenciales_path=None):
        self.base_url = base_url.rstrip("/")
        self.sesion = requests.Session()
        self.credenciales_path = Path(credenciales_path or os.getenv("SIMULADOR_CREDENCIALES", CREDENCIALES_DEFAULT))
        self._login(correo, contrasena)

    def _url(self, ruta):
        return f"{self.base_url}{ruta}"

    def _login(self, correo, contrasena):
        r = self.sesion.post(self._url("/api/auth/login"), json={"correo": correo, "contrasena": contrasena}, timeout=10)
        if not r.ok:
            raise ConnectionError(f"No se pudo iniciar sesion como simulador: {r.status_code} {r.text}")

    def _leer_cache(self):
        if self.credenciales_path.exists():
            return json.loads(self.credenciales_path.read_text(encoding="utf-8"))
        return {}

    def _guardar_cache(self, cache):
        self.credenciales_path.parent.mkdir(parents=True, exist_ok=True)
        self.credenciales_path.write_text(json.dumps(cache, indent=2), encoding="utf-8")

    def _asegurar_credencial(self, id_predio, cache):
        clave = str(id_predio)
        if clave in cache:
            return cache[clave]
        password = secrets.token_urlsafe(18)
        r = self.sesion.put(self._url(f"/api/predios/{id_predio}"), json={"contrasena_mqtt": password}, timeout=10)
        if not r.ok:
            raise ConnectionError(f"No se pudo asignar credencial MQTT al predio {id_predio}: {r.status_code} {r.text}")
        cache[clave] = password
        self._guardar_cache(cache)
        print(f"[NUEVO] Predio {id_predio}: credencial MQTT generada y guardada en {self.credenciales_path}")
        return password

    def descubrir_predios(self):
        """Lista predios y sus sensores activos; asigna credencial MQTT a los predios nuevos."""
        r = self.sesion.get(self._url("/api/predios"), timeout=10)
        if not r.ok:
            raise ConnectionError(f"No se pudo listar predios: {r.status_code} {r.text}")
        predios_api = r.json()["data"]

        cache = self._leer_cache()
        resultado = []
        for p in predios_api:
            id_predio = int(p["id_predio"])
            rs = self.sesion.get(self._url("/api/sensores"), params={"id_predio": id_predio}, timeout=10)
            if not rs.ok:
                raise ConnectionError(f"No se pudo listar sensores del predio {id_predio}: {rs.status_code} {rs.text}")

            sensores = []
            for s in rs.json()["data"]:
                if s.get("estado") != "ACTIVO":
                    continue
                tipo = s["tipo_sensor"]
                defaults = TIPO_DEFAULTS.get(tipo, {"valor_base": 0.0, "sigma": 1.0})
                rango_min, rango_max = float(s["rango_min"]), float(s["rango_max"])
                sensores.append({
                    "id_sensor": int(s["id_sensor"]),
                    "tipo_variable": tipo,
                    "unidad": s.get("unidad_medida") or "",
                    "valor_base": min(max(defaults["valor_base"], rango_min), rango_max),
                    "sigma": defaults["sigma"],
                    "rango_min": rango_min,
                    "rango_max": rango_max,
                })
            if not sensores:
                continue  # predio sin sensores activos: nada que simular todavia

            password = self._asegurar_credencial(id_predio, cache)
            resultado.append({
                "id_predio": id_predio,
                "usuario_mqtt": f"predio-{id_predio}",
                "password_mqtt": password,
                "sensores": sensores,
            })
        return resultado
