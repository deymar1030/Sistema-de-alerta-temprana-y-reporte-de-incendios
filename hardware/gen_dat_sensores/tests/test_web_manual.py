import random
import sys
import threading
import unittest
from collections import deque
from pathlib import Path
from unittest.mock import Mock

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
    cliente._sensores_publicacion_lock = threading.Lock()
    cliente._sensores_publicacion_habilitados = {31: True}
    cliente._escenario_manual_lock = threading.Lock()
    cliente._escenario_manual = None
    cliente._escenario_manual_inicio = None
    cliente._publicaciones_lock = threading.Lock()
    cliente._publicaciones = deque(maxlen=80)
    cliente._conectado = threading.Event()
    cliente.nombre_predio = "Predio de prueba"
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

    def test_pausar_sensor_impide_envios_y_descarta_lectura_manual_pendiente(self):
        self.cliente.programar_lectura_manual(31, 20)
        self.assertFalse(self.cliente.configurar_publicacion_sensor(31, False))
        self.assertFalse(self.cliente.publicacion_sensor_habilitada(31))
        self.assertIsNone(self.cliente._lectura_manual_pendiente(31))
        with self.assertRaisesRegex(ValueError, "esta pausado"):
            self.cliente.programar_lectura_manual(31, 30)

        self.assertTrue(self.cliente.configurar_publicacion_sensor(31, True))
        self.assertTrue(self.cliente.publicacion_sensor_habilitada(31))
        self.assertEqual(self.cliente.programar_lectura_manual(31, 30), 30.0)

    def test_pausar_y_reanudar_todos_los_sensores(self):
        self.cliente.sensores.append({
            "id_sensor": 32,
            "tipo_variable": "CO2",
            "unidad": "ppm",
            "rango_min": 0.0,
            "rango_max": 1000.0,
        })
        self.cliente._sensores_publicacion_habilitados[32] = True
        self.assertFalse(self.cliente.configurar_publicacion_sensores(False))
        self.assertFalse(self.cliente.publicacion_sensor_habilitada(31))
        self.assertFalse(self.cliente.publicacion_sensor_habilitada(32))
        self.assertTrue(self.cliente.configurar_publicacion_sensores(True))
        self.assertTrue(self.cliente.publicacion_sensor_habilitada(31))
        self.assertTrue(self.cliente.publicacion_sensor_habilitada(32))

    def test_publicador_omite_sensor_pausado(self):
        class StopAfterCycle:
            stopped = False

            def is_set(self):
                return self.stopped

            def wait(self, _timeout):
                self.stopped = True

        self.cliente.configurar_publicacion_sensor(31, False)
        self.cliente._detener = StopAfterCycle()
        self.cliente._conectado.set()
        self.cliente.intervalo_segundos = 0
        self.cliente.escenario = "normal"
        self.cliente.inicio_evento = 0
        self.cliente.sensor_pico_id = None
        self.cliente.rng = random.Random(1)
        self.cliente.client = Mock()

        self.cliente._publicar()

        self.cliente.client.publish.assert_not_called()

    def test_interfaz_encola_valor_y_rechaza_fuera_de_rango(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        pagina = web.get("/")
        self.assertEqual(pagina.status_code, 200)
        self.assertIn(b"Predio de prueba", pagina.data)
        self.assertIn(b"Consola de publicaciones recientes", pagina.data)
        self.assertIn(b"sensor-rows", pagina.data)
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

    def test_inicia_y_detiene_escenario_para_predio_seleccionado(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        web.get("/")
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        respuesta = web.post("/escenarios/iniciar", data={
            "csrf_token": csrf,
            "id_predio": "8",
            "escenario": "incendio",
        })
        self.assertEqual(respuesta.status_code, 302)
        self.assertEqual(self.cliente._estado_escenario_manual()[0], "incendio")
        estado = web.get("/api/predios/8/estado").get_json()
        self.assertEqual(estado["predio"]["escenario"], "incendio")

        respuesta = web.post("/escenarios/detener", data={
            "csrf_token": csrf,
            "id_predio": "8",
        })
        self.assertEqual(respuesta.status_code, 302)
        self.assertIsNone(self.cliente._estado_escenario_manual()[0])

    def test_api_escenarios_responde_sin_redireccion_y_devuelve_errores(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        web.get("/")
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        respuesta = web.post("/api/escenarios/iniciar", data={
            "csrf_token": csrf,
            "id_predio": "8",
            "escenario": "calor",
        })
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.get_json()["category"], "success")
        self.assertEqual(self.cliente.escenario_manual_activo, "calor")

        respuesta = web.post("/api/escenarios/iniciar", data={
            "csrf_token": csrf,
            "id_predio": "8",
            "escenario": "desconocido",
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(respuesta.get_json()["category"], "error")
        self.assertEqual(self.cliente.escenario_manual_activo, "calor")

        respuesta = web.post("/api/escenarios/detener", data={
            "csrf_token": csrf,
            "id_predio": "8",
        })
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.get_json()["category"], "success")
        self.assertIsNone(self.cliente.escenario_manual_activo)

    def test_api_escenario_rechaza_token_csrf_invalido_con_json(self):
        app = crear_app([self.cliente])
        app.testing = True
        respuesta = app.test_client().post("/api/escenarios/iniciar", data={
            "csrf_token": "invalido",
            "id_predio": "8",
            "escenario": "calor",
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(respuesta.get_json()["category"], "error")
        self.assertIsNone(self.cliente.escenario_manual_activo)

    def test_api_pausa_y_reanuda_publicacion_por_sensor_y_por_predio(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()
        web.get("/")
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        respuesta = web.post("/api/predios/8/sensores/31/publicacion", data={
            "csrf_token": csrf,
            "habilitado": "false",
        })
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.get_json()["habilitado"])
        self.assertFalse(self.cliente.publicacion_sensor_habilitada(31))

        estado = web.get("/api/predios/8/estado").get_json()
        self.assertFalse(estado["predio"]["sensores"][0]["publicacion_habilitada"])

        respuesta = web.post("/api/predios/8/sensores/publicacion", data={
            "csrf_token": csrf,
            "habilitado": "true",
        })
        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(respuesta.get_json()["habilitado"])
        self.assertTrue(self.cliente.publicacion_sensor_habilitada(31))

    def test_api_publicacion_rechaza_sensor_ajeno_y_estado_invalido(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()
        web.get("/")
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        respuesta = web.post("/api/predios/8/sensores/999/publicacion", data={
            "csrf_token": csrf,
            "habilitado": "false",
        })
        self.assertEqual(respuesta.status_code, 404)

        respuesta = web.post("/api/predios/8/sensores/31/publicacion", data={
            "csrf_token": csrf,
            "habilitado": "si",
        })
        self.assertEqual(respuesta.status_code, 400)
        self.assertTrue(self.cliente.publicacion_sensor_habilitada(31))

    def test_rechaza_escenario_y_predio_invalidos(self):
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        web.get("/")
        with web.session_transaction() as sesion:
            csrf = sesion["csrf_token"]

        for id_predio, escenario in (("999", "incendio"), ("8", "desconocido")):
            with self.subTest(id_predio=id_predio, escenario=escenario):
                respuesta = web.post("/escenarios/iniciar", data={
                    "csrf_token": csrf,
                    "id_predio": id_predio,
                    "escenario": escenario,
                })
                self.assertEqual(respuesta.status_code, 302)
                self.assertIsNone(self.cliente._estado_escenario_manual()[0])

    def test_api_estado_predio_entrega_sensores_conexion_y_publicaciones(self):
        self.cliente._conectado.set()
        self.cliente._registrar_publicacion(
            self.cliente.sensores[0],
            42.5,
            "incendios/8/31",
            "PUBACK",
            "simulado",
        )
        app = crear_app([self.cliente])
        app.testing = True
        web = app.test_client()

        respuesta = web.get("/api/predios/8/estado")
        self.assertEqual(respuesta.status_code, 200)
        data = respuesta.get_json()
        self.assertTrue(data["predio"]["conectado"])
        self.assertEqual(data["predio"]["sensores"][0]["id_sensor"], 31)
        self.assertEqual(data["publicaciones"][0]["estado"], "PUBACK")
        self.assertEqual(data["publicaciones"][0]["valor"], 42.5)

        respuesta = web.get("/api/predios/999/estado")
        self.assertEqual(respuesta.status_code, 404)

    def test_escenario_combinado_eleva_variables_gradualmente_sin_salir_del_rango(self):
        from cliente_predio import generar_valor

        base = {
            "valor_base": 21.0,
            "sigma": 0.0,
            "rango_min": -40.0,
            "rango_max": 125.0,
        }
        valores = {}
        for tipo in ("TEMPERATURA", "CO2", "GAS_LEL", "HUMEDAD", "HUMO", "CO"):
            sensor = {**base, "id_sensor": 1, "tipo_variable": tipo}
            if tipo == "HUMO":
                sensor["rango_max"] = 1000.0
            if tipo == "TEMPERATURA":
                sensor["temperatura_escenario_max"] = 80.0
            valores[tipo] = generar_valor(
                sensor, escenario="incendio", segundos=120, inicio_evento=0
            )
            self.assertGreaterEqual(valores[tipo], sensor["rango_min"])
            self.assertLessEqual(valores[tipo], sensor["rango_max"])

        self.assertEqual(valores["TEMPERATURA"], 80.0)
        self.assertGreater(valores["CO2"], base["valor_base"])
        self.assertGreater(valores["GAS_LEL"], base["valor_base"])
        self.assertLess(valores["HUMEDAD"], 20.0)
        self.assertGreater(valores["HUMO"], 500.0)
        self.assertGreater(valores["CO"], base["valor_base"])

    def test_humo_supera_500_desde_el_inicio_del_incendio(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 5.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 1000.0,
            "tipo_variable": "HUMO",
        }
        inicio = generar_valor(sensor, escenario="incendio", segundos=3, inicio_evento=3)
        antes = generar_valor(sensor, escenario="incendio", segundos=2, inicio_evento=3)
        self.assertGreater(inicio, 500.0)
        self.assertEqual(antes, sensor["valor_base"])

    def test_humo_de_incendio_respeta_el_maximo_configurado(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 5.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 400.0,
            "tipo_variable": "HUMO",
        }
        valor = generar_valor(sensor, escenario="incendio", segundos=3, inicio_evento=3)
        self.assertEqual(valor, sensor["rango_max"])

    def test_incendio_varia_co_y_humedad_desde_el_inicio_del_evento(self):
        from cliente_predio import generar_valor

        base = {
            "valor_base": 50.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 1000.0,
        }
        co = generar_valor(
            {**base, "tipo_variable": "CO"},
            escenario="incendio",
            segundos=1,
            inicio_evento=1,
        )
        humedad = generar_valor(
            {**base, "tipo_variable": "HUMEDAD", "rango_max": 100.0},
            escenario="incendio",
            segundos=1,
            inicio_evento=1,
        )
        self.assertGreater(co, base["valor_base"])
        self.assertLess(humedad, 20.0)

    def test_humedad_de_incendio_respeta_el_minimo_configurado(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 50.0,
            "sigma": 0.0,
            "rango_min": 25.0,
            "rango_max": 100.0,
            "tipo_variable": "HUMEDAD",
        }
        valor = generar_valor(sensor, escenario="incendio", segundos=10, inicio_evento=0)
        self.assertEqual(valor, 25.0)

    def test_temperatura_de_incendio_sube_completa_desde_la_primera_lectura(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 21.0,
            "sigma": 0.0,
            "rango_min": -40.0,
            "rango_max": 125.0,
            "id_sensor": 1,
            "tipo_variable": "TEMPERATURA",
            "temperatura_escenario_max": 80.0,
        }
        inicio = generar_valor(sensor, escenario="incendio", segundos=0, inicio_evento=0)
        posterior = generar_valor(sensor, escenario="incendio", segundos=10, inicio_evento=0)
        self.assertEqual(inicio, 80.0)
        self.assertEqual(posterior, 80.0)

    def test_temperatura_de_calor_sube_completa_desde_la_primera_lectura(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 21.0,
            "sigma": 0.0,
            "rango_min": -40.0,
            "rango_max": 125.0,
            "id_sensor": 1,
            "tipo_variable": "TEMPERATURA",
            "temperatura_escenario_max": 80.0,
        }
        primera = generar_valor(sensor, escenario="calor", segundos=0, inicio_evento=0)
        posterior = generar_valor(sensor, escenario="calor", segundos=20, inicio_evento=0)
        self.assertEqual(primera, 80.0)
        self.assertEqual(posterior, 80.0)

    def test_temperatura_no_sube_antes_del_inicio_del_evento(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 21.0,
            "sigma": 0.0,
            "rango_min": -40.0,
            "rango_max": 125.0,
            "id_sensor": 1,
            "tipo_variable": "TEMPERATURA",
            "temperatura_escenario_max": 80.0,
        }
        valor = generar_valor(sensor, escenario="incendio", segundos=2, inicio_evento=3)
        self.assertEqual(valor, 21.0)

    def test_escenarios_individuales_afectan_solo_su_variable(self):
        from cliente_predio import generar_valor

        base = {
            "valor_base": 50.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 1000.0,
        }
        casos = (
            ("co", "CO", 60.0),
            ("humo", "HUMO", 501.0),
            ("humedad", "HUMEDAD", 19.0),
        )
        for escenario, variable, esperado in casos:
            with self.subTest(escenario=escenario):
                sensor = {**base, "tipo_variable": variable}
                valor = generar_valor(sensor, escenario=escenario, segundos=0, inicio_evento=0)
                self.assertEqual(valor, esperado)

                otra_variable = {
                    **base,
                    "tipo_variable": "TEMPERATURA",
                    "rango_max": 125.0,
                }
                valor_no_afectado = generar_valor(
                    otra_variable, escenario=escenario, segundos=10, inicio_evento=0
                )
                self.assertEqual(valor_no_afectado, base["valor_base"])

    def test_escenario_gas_completa_rampa_en_quince_segundos(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 420.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 10000.0,
            "tipo_variable": "CO2",
        }
        mitad = generar_valor(sensor, escenario="gas", segundos=7.5, inicio_evento=0)
        final = generar_valor(sensor, escenario="gas", segundos=15, inicio_evento=0)
        self.assertEqual(mitad, 1320.0)
        self.assertEqual(final, 2220.0)

    def test_selector_muestra_escenarios_individuales_y_combinado(self):
        app = crear_app([self.cliente])
        app.testing = True
        respuesta = app.test_client().get("/")
        self.assertEqual(respuesta.status_code, 200)
        for escenario in ("gas", "calor", "co", "humo", "humedad", "incendio"):
            with self.subTest(escenario=escenario):
                self.assertIn(f'value="{escenario}"'.encode(), respuesta.data)
        self.assertIn("Incendio combinado".encode(), respuesta.data)

    def test_gas_en_incendio_conserva_rampa_de_diez_segundos(self):
        from cliente_predio import generar_valor

        sensor = {
            "valor_base": 420.0,
            "sigma": 0.0,
            "rango_min": 0.0,
            "rango_max": 10000.0,
            "id_sensor": 1,
            "tipo_variable": "CO2",
        }
        mitad = generar_valor(sensor, escenario="incendio", segundos=5, inicio_evento=0)
        final = generar_valor(sensor, escenario="incendio", segundos=10, inicio_evento=0)
        self.assertEqual(mitad, 1320.0)
        self.assertEqual(final, 2220.0)


class IntervaloPublicacionTest(unittest.TestCase):
    def test_intervalo_predeterminado_y_limites_configurables(self):
        cliente = ClientePredio(8, "usuario", "contrasena", [])
        self.assertEqual(cliente.intervalo_segundos, 15)

        cliente_minimo = ClientePredio(8, "usuario", "contrasena", [], intervalo_segundos=5)
        cliente_maximo = ClientePredio(8, "usuario", "contrasena", [], intervalo_segundos=60)
        self.assertEqual(cliente_minimo.intervalo_segundos, 5)
        self.assertEqual(cliente_maximo.intervalo_segundos, 60)

        for intervalo in (4, 61):
            with self.subTest(intervalo=intervalo):
                with self.assertRaisesRegex(ValueError, "entre 5 y 60 segundos"):
                    ClientePredio(
                        8, "usuario", "contrasena", [], intervalo_segundos=intervalo
                    )


if __name__ == "__main__":
    unittest.main()
