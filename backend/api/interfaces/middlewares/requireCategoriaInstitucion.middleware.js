import { AuthErrors } from "../../domain/auth/errors/authError.js";

// Exige que requireAuth ya haya corrido (usa req.auth.usuario.institucion).
// Decide que puede hacer el usuario segun la categoria de SU institucion --
// separado de requireRole(), que decide por rol de usuario.
export function requireCategoriaInstitucion(...categoriasPermitidas) {
  return (req, res, next) => {
    const categoria = req.auth?.usuario?.institucion?.categoria;

    if (!categoria || !categoriasPermitidas.includes(categoria)) {
      const error = AuthErrors.forbidden();
      return res.status(error.status).json({ success: false, error: error.message, code: error.code });
    }

    next();
  };
}
