import { SESSION_COOKIE_NAME } from "../api/config/sessionCookie.js";

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
