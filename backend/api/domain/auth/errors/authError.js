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
  forbidden: () =>
    new AuthError("No tiene permisos para esta acción", { status: 403, code: "FORBIDDEN" }),
  sessionExpired: () =>
    new AuthError("La sesión expiró", { status: 401, code: "SESSION_EXPIRED" }),
  sessionNotFound: () =>
    new AuthError("Sesión no encontrada", { status: 404, code: "SESSION_NOT_FOUND" }),
  validationError: (message) => new AuthError(message, { status: 400, code: "VALIDATION_ERROR" }),
  correoYaRegistrado: () =>
    new AuthError("El correo ya está registrado", { status: 409, code: "CORREO_YA_REGISTRADO" }),
};
