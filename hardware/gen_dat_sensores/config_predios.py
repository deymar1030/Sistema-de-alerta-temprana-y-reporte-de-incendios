"""Descubre predios y sensores reales contra el backend; sin manifiesto estatico."""
import os

from backend_api import ClienteBackend

BACKEND_URL_DEFAULT = "http://127.0.0.1:3000"


def cargar_predios(backend_url=None, correo=None, contrasena=None, credenciales_path=None):
    url = backend_url or os.getenv("SIMULADOR_BACKEND_URL", BACKEND_URL_DEFAULT)
    correo = correo or os.getenv("SIMULADOR_CORREO")
    contrasena = contrasena or os.getenv("SIMULADOR_CONTRASENA")
    if not correo or not contrasena:
        raise ValueError(
            "Faltan credenciales del usuario de simulacion "
            "(--correo/--contrasena o SIMULADOR_CORREO/SIMULADOR_CONTRASENA)"
        )
    cliente = ClienteBackend(url, correo, contrasena, credenciales_path)
    predios = cliente.descubrir_predios()
    if not predios:
        raise ValueError("El backend no devolvio predios con sensores activos")
    return predios
