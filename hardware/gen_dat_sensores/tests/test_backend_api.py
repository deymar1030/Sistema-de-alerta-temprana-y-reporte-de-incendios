import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend_api import ClienteBackend


class Respuesta:
    ok = True
    status_code = 200
    text = ""

    def __init__(self, data=None):
        self.data = data

    def json(self):
        return {"data": self.data}


class SesionFalsa:
    def __init__(self, predios, sensores):
        self.predios = predios
        self.sensores = sensores
        self.llamadas = []

    def post(self, url, json, timeout):
        self.llamadas.append(("POST", url, json))
        return Respuesta()

    def get(self, url, params=None, timeout=None):
        self.llamadas.append(("GET", url, params))
        if url.endswith("/api/predios"):
            return Respuesta(self.predios)
        return Respuesta(self.sensores.get(params["id_predio"], []))


class ClienteBackendTest(unittest.TestCase):
    def crear_cliente(self, directorio, sesion):
        credenciales = Path(directorio) / "credenciales.json"
        credenciales.write_text(json.dumps({"8": "password-segura"}), encoding="utf-8")
        with patch("backend_api.requests.Session", return_value=sesion):
            return ClienteBackend("http://backend.test", "simulador@test", "password", credenciales)

    def test_descubre_sensor_y_usa_credencial_existente(self):
        sesion = SesionFalsa([{"id_predio": 8}], {
            8: [{
                "id_sensor": 31,
                "tipo_sensor": "TEMPERATURA",
                "unidad_medida": "C",
                "rango_min": 0,
                "rango_max": 80,
                "estado": "ACTIVO",
            }]
        })

        with tempfile.TemporaryDirectory() as directorio:
            cliente = self.crear_cliente(directorio, sesion)
            resultado = cliente.descubrir_predios()

        self.assertEqual(resultado[0]["id_predio"], 8)
        self.assertEqual(resultado[0]["usuario_mqtt"], "predio-8")
        self.assertEqual(resultado[0]["password_mqtt"], "password-segura")
        self.assertEqual([llamada[0] for llamada in sesion.llamadas], ["POST", "GET", "GET"])

    def test_falla_si_falta_credencial_sin_provisionarla_por_api(self):
        sesion = SesionFalsa([{"id_predio": 9}], {
            9: [{
                "id_sensor": 41,
                "tipo_sensor": "HUMEDAD",
                "unidad_medida": "%",
                "rango_min": 0,
                "rango_max": 100,
                "estado": "ACTIVO",
            }]
        })

        with tempfile.TemporaryDirectory() as directorio:
            cliente = self.crear_cliente(directorio, sesion)
            with self.assertRaisesRegex(ValueError, "predios: 9"):
                cliente.descubrir_predios()

        self.assertFalse(any(llamada[0] == "PUT" for llamada in sesion.llamadas))

    def test_rechaza_formato_de_credenciales_invalido(self):
        sesion = SesionFalsa([], {})
        with tempfile.TemporaryDirectory() as directorio:
            ruta = Path(directorio) / "credenciales.json"
            ruta.write_text(json.dumps({"8": {"password": "valor"}}), encoding="utf-8")
            with patch("backend_api.requests.Session", return_value=sesion):
                cliente = ClienteBackend("http://backend.test", "simulador@test", "password", ruta)

            with self.assertRaisesRegex(ValueError, "Formato invalido"):
                cliente.descubrir_predios()


if __name__ == "__main__":
    unittest.main()
