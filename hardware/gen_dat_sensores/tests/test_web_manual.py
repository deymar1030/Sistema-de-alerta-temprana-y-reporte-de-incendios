import sys
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cliente_predio import ClientePredio
from web_manual import crear_app


def crear_cliente():
    cliente = ClientePredio.__new__(ClientePredio)
    cliente.id_predio = 8
    cliente.sensores = [{
        "id_sensor": 31,
        "tipo_variable": "TEMPERATURA",
        "unidad": "C",
        "rango_min": 0.0,
        "rango_max": 80.0,
    }]
    cliente._lecturas_manuales_lock = threading.Lock()
    cliente._lecturas_manuales = {}
    return cliente


class LecturasManualesTest(unittest.TestCase):
    def setUp(self):
        self.cliente = crear_cliente()

    def test_encola_y_confirma_lectura_manual_una_vez(self):
        valor = self.cliente.programar_lectura_manual(31, "42.123456")
        self.assertEqual(valor, 42.1235)
        self.assertEqual(self.cliente._lectura_manual_pendiente(31), 42.1235)
        self.cliente._confirmar_lectura_manual(31, valor)
        self.assertIsNone(self.cliente._lectura_manual_pendiente(31))

    def test_rechaza_sensor_ajeno_valor_invalido_o_lectura_duplicada(self):
        for sensor, valor in ((999, 1), (31, "nan"), (31, 81)):
            with self.subTest(sensor=sensor, valor=valor):
                with self.assertRaises(ValueError):
                    self.cliente.programar_lectura_manual(sensor, valor)
        self.cliente.programar_lectura_manual(31, 20)
        with self.assertRaisesRegex(ValueError, "pendiente"):
            self.cliente.programar_lectura_manual(31, 30)

    def test_confirmar_valor_distinto_no_descarta_lectura_pendiente(self):
        self.cliente.programar_lectura_manual(31, 20)
        self.cliente._confirmar_lectura_manual(31, 30)
        self.assertEqual(self.cliente._lectura_manual_pendiente(31), 20)

    def test_interfaz_encola_valor_y_rechaza_fuera_de_rango(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        pagina = web.get("/")
        self.assertEqual(pagina.status_code, 200)
        self.assertIn(b"Predio 8", pagina.data)
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        respuesta = web.post("/lecturas", data={
            "csrf_token": csrf,
            "id_sensor": "31",
            "valor": "55",
        })
        self.assertEqual(respuesta.status_code, 302)
        self.assertEqual(self.cliente._lectura_manual_pendiente(31), 55.0)
        self.cliente._confirmar_lectura_manual(31, 55.0)

        respuesta = web.post("/lecturas", data={
            "csrf_token": csrf,
            "id_sensor": "31",
            "valor": "90",
        })
        self.assertEqual(respuesta.status_code, 302)
        self.assertIsNone(self.cliente._lectura_manual_pendiente(31))

    def test_interfaz_rechaza_post_sin_token_csrf(self):
        app = crear_app([self.cliente])
        app.testing = True
        respuesta = app.test_client().post("/lecturas", data={
            "id_sensor": "31",
            "valor": "55",
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertIsNone(self.cliente._lectura_manual_pendiente(31))


if __name__ == "__main__":
    unittest.main()
