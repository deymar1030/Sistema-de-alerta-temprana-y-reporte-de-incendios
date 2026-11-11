"""Crea en el backend los 6 tipos de sensor para cada predio que no los tenga.

Por defecto SOLO MUESTRA lo que haria (simulacion). Para crear de verdad:
    .venv\\Scripts\\python.exe crear_sensores.py --confirmar
Opciones: --predios 10,11   (solo esos IDs)    --tipos TEMPERATURA,HUMEDAD

No duplica: si el predio ya tiene un sensor de ese tipo, lo salta.
Avisa a tu supervisor antes de usar --confirmar (la BD es compartida).
"""
import argparse
import os

import requests
from dotenv import load_dotenv

load_dotenv()

# tipo: (nombre, unidad, rango_min, rango_max) -- mismos rangos que el seed del backend
TIPOS = {
    "TEMPERATURA": ("Temperatura", "°C", -40, 125),
    "HUMEDAD": ("Humedad", "%", 0, 100),
    "CO2": ("CO2", "ppm", 0, 10000),
    "GAS_LEL": ("Gas LEL", "%LEL", 0, 100),
    "HUMO": ("Humo", "ppm", 0, 1000),
    "CO": ("Monoxido de carbono", "ppm", 0, 1000),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--confirmar", action="store_true")
    ap.add_argument("--predios", help="IDs separados por coma")
    ap.add_argument("--tipos", help="Tipos separados por coma (default: los 6)")
    a = ap.parse_args()
    tipos = [t.strip().upper() for t in a.tipos.split(",")] if a.tipos else list(TIPOS)
    malos = [t for t in tipos if t not in TIPOS]
    if malos:
        ap.error(f"Tipos invalidos: {malos}. Validos: {list(TIPOS)}")

    base = os.getenv("SIMULADOR_BACKEND_URL", "http://127.0.0.1:3000").rstrip("/")
    s = requests.Session()
    r = s.post(f"{base}/api/auth/login",
               json={"correo": os.environ["SIMULADOR_CORREO"], "contrasena": os.environ["SIMULADOR_CONTRASENA"]}, timeout=10)
    if not r.ok:
        raise SystemExit(f"Login fallido: {r.status_code} {r.text}")

    predios = s.get(f"{base}/api/predios", timeout=10).json()["data"]
    if a.predios:
        ids = {int(x) for x in a.predios.split(",")}
        predios = [p for p in predios if int(p["id_predio"]) in ids]

    nuevos = 0
    for p in predios:
        idp = int(p["id_predio"])
        existentes = {x["tipo_sensor"] for x in s.get(f"{base}/api/sensores", params={"id_predio": idp}, timeout=10).json()["data"]}
        for tipo in tipos:
            if tipo in existentes:
                continue
            nombre, unidad, rmin, rmax = TIPOS[tipo]
            cuerpo = {"id_predio": idp, "nombre": f"{nombre} P{idp}", "tipo_sensor": tipo, "unidad_medida": unidad,
                      "modelo": "SIMULADO", "estado": "ACTIVO", "rango_min": rmin, "rango_max": rmax}
            if not a.confirmar:
                print(f"[SIMULACION] predio {idp}: crearia {tipo}")
            else:
                resp = s.post(f"{base}/api/sensores", json=cuerpo, timeout=10)
                print(f"[{'OK' if resp.ok else 'ERROR'}] predio {idp} {tipo}: {resp.status_code} {'' if resp.ok else resp.text}")
            nuevos += 1
    print(f"\n{nuevos} sensores {'creados' if a.confirmar else 'por crear (nada se creo; usa --confirmar)'}.")


if __name__ == "__main__":
    main()
