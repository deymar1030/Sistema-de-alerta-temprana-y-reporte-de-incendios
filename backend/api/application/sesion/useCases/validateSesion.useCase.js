import { AuthErrors } from "../../../domain/auth/errors/authError.js";
import { SessionToken } from "../../../config/sessionToken.js";

export default class ValidateSesionUseCase {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  async execute(token) {
    if (!token) throw AuthErrors.unauthenticated();

    const sesion = await this.sesionRepository.findByTokenHash(SessionToken.hash(token));
    if (!sesion) throw AuthErrors.unauthenticated();

    if (sesion.expira_en <= new Date()) throw AuthErrors.sessionExpired();

    const { usuario, ...datosSesion } = sesion;
    return { sesion: datosSesion, usuario };
  }
}
