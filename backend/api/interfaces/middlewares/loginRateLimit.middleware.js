import rateLimit from "express-rate-limit";
import { envs } from "../../config/envs.js";

// Limite por IP sobre intentos de login fallidos (los exitosos no cuentan).
// Complementa el bloqueo por cuenta, que no frena a quien prueba muchas cuentas.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envs.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      error: "Demasiados intentos. Intenta más tarde",
      code: "TOO_MANY_REQUESTS",
    }),
});
