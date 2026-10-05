import { AuthErrors } from "../../../domain/auth/errors/authError.js";
import { SessionToken } from "../../../config/sessionToken.js";

const INTERVALO_ACTUALIZACION_MS = 60 * 1000;

// Sesion: dado el valor de la cookie, dice si la sesion sigue vigente y de que
// usuario es. No decide que puede hacer ese usuario (eso es autorizacion).
export default class ValidateSesionUseCase {
  constructor(sesionRepository, { inactividadMinutos }) {
    this.sesionRepository = sesionRepository;
    this.inactividadMs = inactividadMinutos * 60 * 1000;
  }

  async execute(token) {
    if (!token) throw AuthErrors.unauthenticated();

    const sesion = await this.sesionRepository.findByTokenHash(SessionToken.hash(token));
    if (!sesion) throw AuthErrors.unauthenticated();

    const ahora = new Date();
    if (sesion.revocada_en) throw AuthErrors.sessionRevoked();
    if (sesion.expira_en <= ahora) throw AuthErrors.sessionExpired();
    if (ahora - sesion.ultima_actividad > this.inactividadMs) throw AuthErrors.sessionExpired();

    if (ahora - sesion.ultima_actividad > INTERVALO_ACTUALIZACION_MS) {
      await this.sesionRepository.touch(sesion.id_sesion, ahora);
    }

    const { usuario, ...datosSesion } = sesion;
    return { sesion: datosSesion, usuario };
  }
}
