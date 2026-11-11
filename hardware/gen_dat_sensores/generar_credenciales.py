"""Arma runtime/credenciales_predios.json emparejando por NOMBRE de predio.

La tabla contrasenas-predios.md trae un numero "#" que NO es el id real del
predio en el sistema (ej. "Mercado Rodriguez" es # 1 en la tabla pero
id_predio 10 en el backend). Por eso se empareja por nombre.

Uso (dentro de gen_dat_sensores, con tu .env listo):
    .venv\\Scripts\\python.exe generar_credenciales.py contrasenas-predios.md
"""
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()
FILA = re.compile(r"^\|\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|[^|]*\|\s*`([^`]+)`\s*\|\s*$")


def norm(texto):
    t = unicodedata.normalize("NFD", texto)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t).strip().lower()


def leer_tabla(ruta):
    filas = []
    for linea in Path(ruta).read_text(encoding="utf-8").splitlines():
        m = FILA.match(linea)
        if m:
            filas.append((m.group(1), m.group(2), m.group(3)))
    return filas


def main():
    if len(sys.argv) != 2:
        sys.exit("Uso: python generar_credenciales.py contrasenas-predios.md")
    filas = leer_tabla(sys.argv[1])
    if not filas:
        sys.exit("No encontre filas con contrasenas en ese archivo.")

    base = os.getenv("SIMULADOR_BACKEND_URL", "http://127.0.0.1:3000").rstrip("/")
    s = requests.Session()
    r = s.post(f"{base}/api/auth/login", json={"correo": os.environ["SIMULADOR_CORREO"],
                                               "contrasena": os.environ["SIMULADOR_CONTRASENA"]}, timeout=10)
    if not r.ok:
        sys.exit(f"Login fallido: {r.status_code} {r.text}")
    predios = s.get(f"{base}/api/predios", timeout=10).json()["data"]
    por_nombre = {norm(p["nombre"]): int(p["id_predio"]) for p in predios}

    credenciales, sin_pareja = {}, []
    for num, nombre, password in filas:
        idp = por_nombre.get(norm(nombre))
        if idp is None:
            sin_pareja.append(f"#{num} {nombre}")
        else:
            credenciales[str(idp)] = password
            print(f"  {nombre[:45]:<45} -> id_predio {idp} (usuario predio-{idp}, clave {password})")

    destino = Path(__file__).resolve().parent / "runtime" / "credenciales_predios.json"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(json.dumps(dict(sorted(credenciales.items(), key=lambda kv: int(kv[0]))), indent=2), encoding="utf-8")
    print(f"\n{len(credenciales)} predios guardados en {destino}")
    if sin_pareja:
        print("SIN PAREJA en el backend (revisar nombres):", *sin_pareja, sep="\n  ")


if __name__ == "__main__":
    main()