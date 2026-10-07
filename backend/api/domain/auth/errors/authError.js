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
  unauthenticated: () => new AuthError("No autenticado", { status: 401, code: "UNAUTHENTICATED" }),
  sessionExpired: () =>
    new AuthError("La sesión expiró", { status: 401, code: "SESSION_EXPIRED" }),
  sessionNotFound: () =>
    new AuthError("Sesión no encontrada", { status: 404, code: "SESSION_NOT_FOUND" }),
};
