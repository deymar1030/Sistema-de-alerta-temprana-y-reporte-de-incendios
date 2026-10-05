import { SESSION_COOKIE_NAME } from "../api/config/sessionCookie.js";

// El handshake de Socket.IO no pasa por cookie-parser (eso es middleware
// de Express), asi que la cookie "sid" se lee a mano del header crudo.
function leerCookie(cookieHeader, nombre) {
  if (!cookieHeader) return null;

  for (const parte of cookieHeader.split(";")) {
    const idx = parte.indexOf("=");
    if (idx === -1) continue;

    const clave = parte.slice(0, idx).trim();
    if (clave === nombre) {
      return decodeURIComponent(parte.slice(idx + 1).trim());
    }
  }

  return null;
}

// io.use(...) -- valida la sesion antes de aceptar la conexion, con el
// mismo ValidateSesionUseCase que usa requireAuth en HTTP (ver
// docs/GuiaTiempoReal.md §3). Si no hay sesion valida, rechaza la
// conexion (el cliente recibe un "connect_error").
export function createSocketAuth(validateSesionUseCase) {
  return async (socket, next) => {
    const token = leerCookie(socket.handshake.headers.cookie, SESSION_COOKIE_NAME);

    try {
      const { usuario, sesion } = await validateSesionUseCase.execute(token);
      socket.data.auth = { usuario, sesion };
      next();
    } catch {
      next(new Error("No autenticado"));
    }
  };
}
