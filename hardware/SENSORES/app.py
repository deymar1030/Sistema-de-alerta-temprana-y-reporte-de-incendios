"""Interfaz Flask para controlar el simulador MQTT e inyectar incendios manualmente.

Uso:  python app.py   ->  http://127.0.0.1:5000
"""
import atexit

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

load_dotenv()
from simulador_manager import SimuladorManager  # noqa: E402

app = Flask(__name__)
sim = SimuladorManager()
atexit.register(sim.cerrar)
BASELINE_SEG = 420  # el motor de deteccion necesita ~7 min de linea base


def responder(fn):
    try:
        fn()
        return jsonify(ok=True)
    except Exception as e:  # noqa: BLE001
        return jsonify(ok=False, error=str(e)), 400


@app.get("/")
def index():
    return render_template("index.html", baseline=BASELINE_SEG)


@app.get("/api/estado")
def estado():
    return jsonify(sim.estado())


@app.post("/api/refrescar")
def refrescar():
    return responder(sim.refrescar)


@app.post("/api/predios/<int:pid>/iniciar")
def iniciar(pid):
    return responder(lambda: sim.iniciar(pid))


@app.post("/api/predios/<int:pid>/detener")
def detener(pid):
    return responder(lambda: sim.detener(pid))


@app.post("/api/predios/<int:pid>/incendio")
def incendio(pid):
    d = request.get_json(force=True)
    return responder(lambda: sim.evento(pid, d.get("tipo", "incendio"),
                                        float(d.get("intensidad", 1)), float(d.get("rampa", 60))))


@app.post("/api/predios/<int:pid>/apagar")
def apagar(pid):
    return responder(lambda: sim.apagar(pid))


@app.post("/api/todos/<accion>")
def todos(accion):
    def run():
        for pid in list(sim.predios):
            try:
                sim.iniciar(pid) if accion == "iniciar" else sim.detener(pid)
            except Exception:  # noqa: BLE001 - el error queda en el predio
                pass
    return responder(run)


if __name__ == "__main__":
    try:
        print(f"{sim.refrescar()} predios con sensores activos descubiertos")
    except Exception as e:  # noqa: BLE001
        print(f"[AVISO] No se pudo descubrir predios al iniciar: {e} (usa 'Actualizar' en la web)")
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
