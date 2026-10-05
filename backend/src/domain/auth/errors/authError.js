export class AuthError extends Error {
  constructor(message, { status = 401, code = "UNAUTHENTICATED" } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const AuthErrors = {
  invalidCredentials: () =>
    new AuthError("Credenciales inválidas", { status: 401, code: "INVALID_CREDENTIALS" }),
  accountLocked: () =>
    new AuthError("Demasiados intentos fallidos. Intenta más tarde", {
      status: 429,
      code: "ACCOUNT_LOCKED",
    }),
  unauthenticated: () => new AuthError("No autenticado", { status: 401, code: "UNAUTHENTICATED" }),
  sessionExpired: () =>
    new AuthError("La sesión expiró", { status: 401, code: "SESSION_EXPIRED" }),
  sessionRevoked: () =>
    new AuthError("La sesión fue cerrada", { status: 401, code: "SESSION_REVOKED" }),
  sessionNotFound: () =>
    new AuthError("Sesión no encontrada", { status: 404, code: "SESSION_NOT_FOUND" }),
};
