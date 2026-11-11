import { AuthErrors } from "../../../domain/auth/errors/authError.js";
import { SessionToken } from "../../../config/sessionToken.js";

export default class ValidateSesionUseCase {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  // permitirMfaPendiente: solo lo pasan las rutas /auth/mfa/* (ver
  // requireAuth.middleware.js), que son las unicas que deben aceptar una
  // sesion todavia no confirmada por el segundo factor.
  async execute(token, { permitirMfaPendiente = false } = {}) {
    if (!token) throw AuthErrors.unauthenticated();

    const sesion = await this.sesionRepository.findByTokenHash(SessionToken.hash(token));
    if (!sesion) throw AuthErrors.unauthenticated();

    if (sesion.expira_en <= new Date()) throw AuthErrors.sessionExpired();

    const { usuario, ...datosSesion } = sesion;
    if (!usuario.estado || usuario.fecha_eliminacion) throw AuthErrors.unauthenticated();
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      throw AuthErrors.cuentaBloqueada();
    }

    if (Boolean(datosSesion.mfa_pendiente) !== permitirMfaPendiente) {
      throw AuthErrors.unauthenticated();
    }

    return { sesion: datosSesion, usuario };
  }
}
