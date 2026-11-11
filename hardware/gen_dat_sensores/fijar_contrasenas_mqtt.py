"""Fija la contrasena MQTT de cada predio en el backend (PUT /api/predios/{id}).

Toma los valores de runtime/credenciales_predios.json (ID de predio -> contrasena).
Por defecto SOLO SIMULA: no cambia nada. SOLO usalo si tu supervisor lo autorizo.

    .venv\\Scripts\\python.exe fijar_contrasenas_mqtt.py                       (simulacion)
    .venv\\Scripts\\python.exe fijar_contrasenas_mqtt.py --predios 10 --confirmar   (solo el predio 10)
    .venv\\Scripts\\python.exe fijar_contrasenas_mqtt.py --confirmar                (todos)

Recomendado: primero --predios 10 --confirmar, luego correr diagnostico.py y
ver que predio-10 salga OK; recien despues hacer todos.
"""
import argparse
import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

from backend_api import CREDENCIALES_DEFAULT

load_dotenv()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--confirmar", action="store_true", help="aplicar los cambios de verdad")
    ap.add_argument("--predios", help="IDs separados por coma (default: todos los del JSON)")
    a = ap.parse_args()

    ruta = Path(os.getenv("SIMULADOR_CREDENCIALES", CREDENCIALES_DEFAULT))
    cred = json.loads(ruta.read_text(encoding="utf-8"))
    if a.predios:
        ids = {x.strip() for x in a.predios.split(",")}
        cred = {k: v for k, v in cred.items() if k in ids}
    if not cred:
        raise SystemExit("No hay predios que procesar.")

    base = os.getenv("SIMULADOR_BACKEND_URL", "http://127.0.0.1:3000").rstrip("/")
    s = requests.Session()
    r = s.post(f"{base}/api/auth/login", json={"correo": os.environ["SIMULADOR_CORREO"],
                                               "contrasena": os.environ["SIMULADOR_CONTRASENA"]}, timeout=10)
    if not r.ok:
        raise SystemExit(f"Login fallido: {r.status_code} {r.text}")

    hechos = 0
    for idp, password in cred.items():
        if len(password) < 8:
            print(f"[SALTADO] predio {idp}: el backend exige minimo 8 caracteres")
            continue
        g = s.get(f"{base}/api/predios/{idp}", timeout=10)
        if not g.ok:
            print(f"[SALTADO] predio {idp}: no existe o no se pudo leer ({g.status_code})")
            continue
        nombre = (g.json().get("data") or {}).get("nombre", "?")
        if not a.confirmar:
            print(f"[SIMULACION] predio {idp} ({nombre}): fijaria contrasena MQTT")
        else:
            p = s.put(f"{base}/api/predios/{idp}", json={"contrasena_mqtt": password}, timeout=10)
            print(f"[{'OK' if p.ok else 'ERROR'}] predio {idp} ({nombre}): {p.status_code} {'' if p.ok else p.text}")
        hechos += 1
    print(f"\n{hechos} predios {'actualizados' if a.confirmar else 'por actualizar (nada cambio; usa --confirmar)'}.")


if __name__ == "__main__":
    main()
