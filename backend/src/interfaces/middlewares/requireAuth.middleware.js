import { AuthError } from "../../domain/auth/errors/authError.js";
import { SessionCookie } from "../../config/sessionCookie.js";
import { isOriginAllowed, forbiddenOrigin } from "./originGuard.middleware.js";

// Exige una sesion vigente. Deja en req.auth:
//   req.auth.usuario -> quien es (incluye id_rol para la futura autorizacion)
//   req.auth.sesion  -> la sesion actual
// Autorizacion (roles/permisos) se agregara despues como otro middleware que
// lea req.auth.usuario; este no decide que puede hacer el usuario.
export function createRequireAuth(validateSesionUseCase) {
  return async (req, res, next) => {
    if (!isOriginAllowed(req)) return forbiddenOrigin(res);

    const token = SessionCookie.read(req);

    try {
      const { sesion, usuario } = await validateSesionUseCase.execute(token);
      req.auth = { sesion, usuario };
      next();
    } catch (error) {
      if (!(error instanceof AuthError)) {
        console.error(error);
        return res
          .status(500)
          .json({ success: false, error: "Error interno del servidor" });
      }

      if (token) SessionCookie.clear(res);

      res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
  };
}
