import { AuthErrors } from "../../../domain/auth/errors/authError.js";

// Cierra una sesion (logout o revocacion). Un usuario solo puede revocar las suyas.
export default class RevokeSesionUseCase {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  async execute({ id_sesion, id_usuario }) {
    const sesion = await this.sesionRepository.findById(Number(id_sesion));

    if (!sesion || sesion.id_usuario !== id_usuario || sesion.revocada_en) {
      throw AuthErrors.sessionNotFound();
    }

    await this.sesionRepository.revoke(sesion.id_sesion, new Date());
  }
}
