import { AuthErrors } from "../../../domain/auth/errors/authError.js";

export default class RevokeSesionUseCase {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  async execute({ id_sesion, id_usuario }) {
    const sesion = await this.sesionRepository.findById(Number(id_sesion));

    if (!sesion || sesion.id_usuario !== id_usuario) {
      throw AuthErrors.sessionNotFound();
    }

    await this.sesionRepository.revoke(sesion.id_sesion);
  }
}
