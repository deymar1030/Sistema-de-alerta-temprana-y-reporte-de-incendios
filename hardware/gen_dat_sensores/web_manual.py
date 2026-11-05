"""Interfaz local para encolar lecturas manuales en clientes MQTT activos."""
import secrets
import threading
from hmac import compare_digest

from flask import Flask, abort, flash, redirect, render_template, request, session, url_for
from werkzeug.serving import make_server

from cliente_predio import ESCENARIOS_MANUALES


def crear_app(clientes):
    app = Flask(__name__)
    app.secret_key = secrets.token_hex(32)
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    sensores = {}
    predios = {}
    for cliente in clientes:
        predios[cliente.id_predio] = cliente
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
                if request.path.startswith("/api/"):
                    return {"message": "Token de formulario invalido; recarga la pagina.", "category": "error"}, 400
                abort(400, description="Token de formulario invalido; recarga la pagina.")

    def responder_formulario(mensaje, categoria="success", status=200, json_response=False):
        if json_response:
            return {"message": mensaje, "category": categoria}, status
        flash(mensaje, categoria)
        return redirect(url_for("inicio"))

    @app.get("/")
    def inicio():
        session.setdefault("csrf_token", secrets.token_urlsafe(32))
        opciones = sorted(sensores.values(), key=lambda item: (item["id_predio"], item["id_sensor"]))
        predios_ordenados = sorted(predios.values(), key=lambda cliente: cliente.id_predio)
        return render_template(
            "manual.html",
            sensores=opciones,
            predios=predios_ordenados,
            escenarios=ESCENARIOS_MANUALES,
        )

    @app.get("/api/predios/<int:id_predio>/estado")
    def estado_predio(id_predio):
        cliente = predios.get(id_predio)
        if cliente is None:
            return {"error": "Predio no disponible."}, 404
        return {
            "predio": {
                "id": cliente.id_predio,
                "nombre": cliente.nombre_predio,
                "conectado": cliente._conectado.is_set(),
                "escenario": cliente.escenario_manual_activo,
                "sensores": [
                    {
                        **sensor,
                        "publicacion_habilitada": cliente.publicacion_sensor_habilitada(
                            sensor["id_sensor"]
                        ),
                    }
                    for sensor in cliente.sensores
                ],
            },
            "publicaciones": cliente.publicaciones_recientes(),
        }

    def leer_estado_publicacion():
        valor = request.form.get("habilitado")
        if valor not in {"true", "false"}:
            return None, {"message": "Indica si el envio debe estar habilitado o pausado.", "category": "error"}, 400
        return valor == "true", None, 200

    @app.post("/api/predios/<int:id_predio>/sensores/publicacion")
    def configurar_publicacion_predio(id_predio):
        cliente = predios.get(id_predio)
        if cliente is None:
            return {"message": "El predio seleccionado no esta disponible.", "category": "error"}, 404
        habilitado, error, status = leer_estado_publicacion()
        if error:
            return error, status
        cliente.configurar_publicacion_sensores(habilitado)
        accion = "reanudo" if habilitado else "pauso"
        return {
            "message": f"Se {accion} el envio de datos de todos los sensores de {cliente.nombre_predio}.",
            "category": "success",
            "habilitado": habilitado,
        }

    @app.post("/api/predios/<int:id_predio>/sensores/<int:id_sensor>/publicacion")
    def configurar_publicacion_sensor(id_predio, id_sensor):
        cliente = predios.get(id_predio)
        if cliente is None:
            return {"message": "El predio seleccionado no esta disponible.", "category": "error"}, 404
        if not any(sensor["id_sensor"] == id_sensor for sensor in cliente.sensores):
            return {"message": "El sensor no pertenece a este predio o no esta activo.", "category": "error"}, 404
        habilitado, error, status = leer_estado_publicacion()
        if error:
            return error, status
        cliente.configurar_publicacion_sensor(id_sensor, habilitado)
        accion = "reanudo" if habilitado else "pauso"
        return {
            "message": f"Se {accion} el envio de datos del sensor {id_sensor}.",
            "category": "success",
            "habilitado": habilitado,
        }

    def procesar_inicio_escenario(json_response=False):
        try:
            id_predio = int(request.form.get("id_predio", ""))
        except ValueError:
            return responder_formulario("Selecciona un predio valido.", "error", 400, json_response)
        cliente = predios.get(id_predio)
        if cliente is None:
            return responder_formulario(
                "El predio seleccionado no esta disponible.", "error", 404, json_response
            )
        try:
            escenario = cliente.iniciar_escenario_manual(request.form.get("escenario", ""))
        except ValueError as error:
            return responder_formulario(str(error), "error", 400, json_response)
        return responder_formulario(
            f"Escenario {escenario} iniciado en {cliente.nombre_predio} "
            f"(predio {id_predio}). Publica lecturas MQTT; detenlo al terminar.",
            json_response=json_response,
        )

    @app.post("/escenarios/iniciar")
    def iniciar_escenario():
        return procesar_inicio_escenario()

    @app.post("/api/escenarios/iniciar")
    def api_iniciar_escenario():
        return procesar_inicio_escenario(json_response=True)

    def procesar_detencion_escenario(json_response=False):
        try:
            id_predio = int(request.form.get("id_predio", ""))
        except ValueError:
            return responder_formulario("Selecciona un predio valido.", "error", 400, json_response)
        cliente = predios.get(id_predio)
        if cliente is None:
            return responder_formulario(
                "El predio seleccionado no esta disponible.", "error", 404, json_response
            )
        escenario = cliente.detener_escenario_manual()
        if escenario:
            return responder_formulario(
                f"Escenario detenido en {cliente.nombre_predio} (predio {id_predio}).",
                json_response=json_response,
            )
        return responder_formulario(
            f"No habia un escenario activo en {cliente.nombre_predio} (predio {id_predio}).",
            "error",
            409,
            json_response,
        )

    @app.post("/escenarios/detener")
    def detener_escenario():
        return procesar_detencion_escenario()

    @app.post("/api/escenarios/detener")
    def api_detener_escenario():
        return procesar_detencion_escenario(json_response=True)

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
