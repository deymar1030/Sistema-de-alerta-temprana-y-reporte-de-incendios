import { AuthErrors } from "../../domain/auth/errors/authError.js";

// Exige que requireAuth ya haya corrido (usa req.auth.usuario). Decide que
// puede hacer el usuario segun su rol -- requireAuth solo decide quien es.
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    const nombreRol = req.auth?.usuario?.rol?.nombre_rol;

    if (!rolesPermitidos.includes(nombreRol)) {
      const error = AuthErrors.forbidden();
      return res.status(error.status).json({ success: false, error: error.message, code: error.code });
    }

    next();
  };
}
