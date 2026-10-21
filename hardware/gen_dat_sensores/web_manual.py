"""Interfaz local para encolar lecturas manuales en clientes MQTT activos."""
import secrets
import threading
from hmac import compare_digest

from flask import Flask, abort, flash, redirect, render_template, request, session, url_for
from werkzeug.serving import make_server


def crear_app(clientes):
    app = Flask(__name__)
    app.secret_key = secrets.token_hex(32)
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    sensores = {}
    for cliente in clientes:
        for sensor in cliente.sensores:
            sensores[sensor["id_sensor"]] = {
                **sensor,
                "id_predio": cliente.id_predio,
                "cliente": cliente,
            }

    @app.before_request
    def validar_csrf():
        if request.method == "POST":
            token = session.get("csrf_token", "")
            enviado = request.form.get("csrf_token", "")
            if not token or not compare_digest(token, enviado):
                abort(400, description="Token de formulario invalido; recarga la pagina.")

    @app.get("/")
    def inicio():
        session.setdefault("csrf_token", secrets.token_urlsafe(32))
        opciones = sorted(sensores.values(), key=lambda item: (item["id_predio"], item["id_sensor"]))
        return render_template("manual.html", sensores=opciones)

    @app.post("/lecturas")
    def crear_lectura():
        try:
            id_sensor = int(request.form.get("id_sensor", ""))
        except ValueError:
            flash("Selecciona un sensor valido.", "error")
            return redirect(url_for("inicio"))
        sensor = sensores.get(id_sensor)
        if sensor is None:
            flash("El sensor seleccionado no esta disponible.", "error")
            return redirect(url_for("inicio"))
        try:
            valor = sensor["cliente"].programar_lectura_manual(
                id_sensor, request.form.get("valor", "")
            )
        except ValueError as error:
            flash(str(error), "error")
            return redirect(url_for("inicio"))

        flash(
            f"Lectura manual {valor} encolada para sensor {id_sensor} "
            f"del predio {sensor['id_predio']}. Se publicara en el siguiente ciclo.",
            "success",
        )
        return redirect(url_for("inicio"))

    return app


def iniciar_interfaz(clientes, puerto=5000):
    servidor = make_server("127.0.0.1", puerto, crear_app(clientes), threaded=True)
    hilo = threading.Thread(target=servidor.serve_forever, name="interfaz-manual", daemon=True)
    hilo.start()
    return servidor, hilo
