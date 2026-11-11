"""Diagnostico: muestra que predios/sensores existen en el backend y que
credenciales MQTT funcionan en el broker. No publica ni modifica nada.

Uso (dentro de gen_dat_sensores, con tu .env ya listo):
    .venv\\Scripts\\python.exe diagnostico.py
"""
import json
import os
import threading
from urllib.parse import urlparse

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

from backend_api import CREDENCIALES_DEFAULT, ClienteBackend

load_dotenv()


def probar_mqtt(host, port, ca, usuario, password):
    resultado = {"msg": "sin respuesta (timeout)"}
    listo = threading.Event()
    c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"diag-{usuario}")
    c.username_pw_set(usuario, password)
    c.tls_set(ca_certs=ca)

    def on_connect(client, userdata, flags, rc, props):
        resultado["msg"] = "OK" if not rc.is_failure else str(rc)
        listo.set()

    c.on_connect = on_connect
    try:
        c.connect(host, port, keepalive=10)
        c.loop_start()
        listo.wait(6)
    except Exception as e:  # noqa: BLE001
        resultado["msg"] = f"error: {e}"
    finally:
        c.loop_stop()
        c.disconnect()
    return resultado["msg"]


def main():
    url = os.getenv("SIMULADOR_BACKEND_URL", "http://127.0.0.1:3000")
    api = ClienteBackend.__new__(ClienteBackend)  # login sin leer credenciales MQTT
    import requests
    api.base_url = url.rstrip("/")
    api.sesion = requests.Session()
    api._login(os.environ["SIMULADOR_CORREO"], os.environ["SIMULADOR_CONTRASENA"])

    predios = api.sesion.get(api._url("/api/predios"), timeout=10).json()["data"]
    print(f"\n=== PREDIOS EN EL BACKEND ({len(predios)}) ===")
    activos = {}
    for p in predios:
        sens = api.sesion.get(api._url("/api/sensores"), params={"id_predio": p["id_predio"]}, timeout=10).json()["data"]
        tipos = sorted({s["tipo_sensor"] for s in sens if s.get("estado") == "ACTIVO"})
        activos[int(p["id_predio"])] = tipos
        print(f"  id_predio={p['id_predio']:>3} | {p.get('nombre','?')[:45]:<45} | sensores activos: {len(tipos) and sum(1 for s in sens if s.get('estado')=='ACTIVO')} {tipos}")

    ruta = os.getenv("SIMULADOR_CREDENCIALES", CREDENCIALES_DEFAULT)
    cred = json.loads(open(ruta, encoding="utf-8").read())
    broker = urlparse(os.getenv("MQTT_BROKER_URL", "mqtts://127.0.0.1:8883"))
    ca = os.getenv("MQTT_CA_FILE")
    print(f"\n=== PRUEBA DE CONTRASENAS EN EL BROKER {broker.hostname}:{broker.port} ===")
    for id_predio, password in cred.items():
        estado = probar_mqtt(broker.hostname, broker.port or 8883, ca, f"predio-{id_predio}", password)
        print(f"  predio-{id_predio:<3} -> {estado}")
    print("\nCompara: los id_predio del backend deben tener 'OK' arriba.")


if __name__ == "__main__":
    main()
