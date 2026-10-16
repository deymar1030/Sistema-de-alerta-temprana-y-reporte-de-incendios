import { envs } from "../../config/envs.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defensa contra CSRF: una peticion que modifica datos, hecha desde un navegador,
// debe venir del propio backend o del frontend autorizado (CORS_ORIGIN).
// Clientes sin cabecera Origin (Postman, curl) no son navegadores y se permiten.
export function isOriginAllowed(req) {
  if (SAFE_METHODS.has(req.method)) return true;

  const origin = req.get("origin");
  if (!origin) return true;

  const propio = `${req.protocol}://${req.get("host")}`;
  return origin === propio || envs.CORS_ORIGINS.includes(origin);
}

export function forbiddenOrigin(res) {
  return res.status(403).json({
    success: false,
    error: "Origen no permitido",
    code: "FORBIDDEN_ORIGIN",
  });
}

export function originGuard(req, res, next) {
  if (!isOriginAllowed(req)) return forbiddenOrigin(res);
  next();
}
