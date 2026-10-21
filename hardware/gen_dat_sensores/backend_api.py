"""Cliente HTTP minimo: descubre predios/sensores y lee credenciales MQTT provisionadas.

No usa manifiestos estaticos: los predios y sensores se consultan en vivo con
un usuario de simulacion. Las credenciales MQTT las provisiona el responsable
del broker y se guardan localmente en runtime/credenciales_predios.json.
"""
import json
import os
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
            cache = json.loads(self.credenciales_path.read_text(encoding="utf-8"))
            if not isinstance(cache, dict) or any(
                not isinstance(id_predio, str)
                or not id_predio.isdigit()
                or int(id_predio) < 1
                or not isinstance(password, str)
                or not password.strip()
                for id_predio, password in cache.items()
            ):
                raise ValueError(
                    f"Formato invalido en {self.credenciales_path}; "
                    "se espera un objeto con ID de predio y contrasena MQTT"
                )
            return cache
        return {}

    def descubrir_predios(self):
        """Lista predios y sensores activos y usa sus credenciales ya provisionadas."""
        r = self.sesion.get(self._url("/api/predios"), timeout=10)
        if not r.ok:
            raise ConnectionError(f"No se pudo listar predios: {r.status_code} {r.text}")
        predios_api = r.json()["data"]

        cache = self._leer_cache()
        resultado = []
        credenciales_faltantes = []
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

            password = cache.get(str(id_predio))
            if password is None:
                credenciales_faltantes.append(id_predio)
                continue
            resultado.append({
                "id_predio": id_predio,
                "usuario_mqtt": f"predio-{id_predio}",
                "password_mqtt": password,
                "sensores": sensores,
            })
        if credenciales_faltantes:
            ids = ", ".join(str(id_predio) for id_predio in credenciales_faltantes)
            raise ValueError(
                f"Faltan credenciales MQTT para los predios: {ids}. "
                "Solicita al responsable del backend/broker que las provisionen "
                f"y agregalas a {self.credenciales_path}."
            )
        return resultado
