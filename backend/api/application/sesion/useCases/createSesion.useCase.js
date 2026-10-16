import { SesionEntity } from "../../../domain/sesion/entities/sesion.entity.js";
import { SessionToken } from "../../../config/sessionToken.js";

const DIAS_RETENCION = 7;

export default class CreateSesionUseCase {
  constructor(sesionRepository, { ttlHoras }) {
    this.sesionRepository = sesionRepository;
    this.ttlHoras = ttlHoras;
  }

  async execute({ id_usuario }) {
    const ahora = new Date();
    const token = SessionToken.generate();

    await this.sesionRepository.purgeAntiguas(
      id_usuario,
      new Date(ahora.getTime() - DIAS_RETENCION * 24 * 60 * 60 * 1000)
    );

    const sesion = await this.sesionRepository.create(
      new SesionEntity({
        id_sesion: null,
        id_usuario,
        token_hash: SessionToken.hash(token),
        expira_en: new Date(ahora.getTime() + this.ttlHoras * 60 * 60 * 1000),
      })
    );

    return { token, sesion };
  }
}
