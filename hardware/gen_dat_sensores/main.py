"""Simulador original de tres predios; compatible con Windows y Linux."""
import argparse
import signal
import threading
import time
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
from requests import RequestException

from config_predios import cargar_predios
from cliente_predio import ClientePredio
from web_manual import iniciar_interfaz

load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="Publica lecturas por MQTT para los predios/sensores reales del backend.")
    parser.add_argument("--intervalo", type=float, default=7)
    parser.add_argument("--backend-url", help="URL de la API, ej. http://host:3000 (default SIMULADOR_BACKEND_URL o localhost:3000)")
    parser.add_argument("--correo", help="Usuario de simulacion (o SIMULADOR_CORREO)")
    parser.add_argument("--contrasena", help="Contrasena del usuario de simulacion (o SIMULADOR_CONTRASENA)")
    parser.add_argument("--credenciales", help="Archivo con contrasenas MQTT provisionadas por predio (default runtime/credenciales_predios.json)")
    parser.add_argument("--broker", help="mqtt://host:1883 o mqtts://host:8883")
    parser.add_argument("--ca", help="CA del broker TLS")
    parser.add_argument("--escenario", choices=["normal", "gas", "calor", "pico"], default="normal")
    parser.add_argument("--inicio-evento", type=float, default=420, help="Segundos de linea base antes del escenario (conservar mas de 5 minutos)")
    parser.add_argument("--duracion", type=float, default=0, help="0: ejecutar hasta Ctrl+C")
    parser.add_argument("--semilla", type=int, default=42)
    parser.add_argument("--web-port", type=int, default=5000, help="Puerto local de la interfaz Flask")
    parser.add_argument("--sin-interfaz", action="store_true", help="Ejecutar solo la publicacion MQTT")
    args = parser.parse_args()
    if (not 5 <= args.intervalo <= 10 or args.duracion < 0 or args.inicio_evento < 0
            or not 1 <= args.web_port <= 65535):
        parser.error("Intervalo entre 5 y 10; duracion e inicio-evento no negativos; puerto web entre 1 y 65535")
    detener = threading.Event()
    signal.signal(signal.SIGINT, lambda *_: detener.set())
    signal.signal(signal.SIGTERM, lambda *_: detener.set())
    clientes = []
    servidor_web = None
    try:
        predios = cargar_predios(args.backend_url, args.correo, args.contrasena, args.credenciales)
        ids_sensores = [s["id_sensor"] for p in predios for s in p["sensores"]]
        sensor_pico_id = min(ids_sensores) if ids_sensores else None
        for p in predios:
            c = ClientePredio(p["id_predio"], p["usuario_mqtt"], p["password_mqtt"], p["sensores"],
                              args.intervalo, args.broker, args.ca, args.escenario,
                              args.semilla + p["id_predio"], args.inicio_evento, sensor_pico_id)
            clientes.append(c)
            c.conectar()
        for c in clientes:
            c.iniciar_publicacion()
        print(f"Simulando {len(clientes)} predios; Ctrl+C para detener.")
        if not args.sin_interfaz:
            servidor_web, _ = iniciar_interfaz(clientes, args.web_port)
            print(f"Interfaz manual disponible solo en este equipo: http://127.0.0.1:{args.web_port}")
        # En Windows, esperar sin limite de tiempo (wait(None)) bloquea sin dejar
        # que el interprete procese Ctrl+C. Se sondea cada 0.5s en su lugar.
        limite = time.monotonic() + args.duracion if args.duracion else None
        while not detener.is_set():
            if limite is not None and time.monotonic() >= limite:
                break
            detener.wait(0.5)
    except (ValueError, OSError, RequestException) as error:
        parser.exit(1, f"Error de simulacion: {error}\n")
    finally:
        if servidor_web:
            servidor_web.shutdown()
        if clientes:
            # Todos a la vez: cada uno espera hasta 12s a su hilo, en paralelo
            # en vez de en serie (si no, N predios tardarian N*12s en cerrar).
            with ThreadPoolExecutor(max_workers=len(clientes)) as pool:
                list(pool.map(lambda c: c.desconectar(), clientes))


if __name__ == "__main__":
    main()
