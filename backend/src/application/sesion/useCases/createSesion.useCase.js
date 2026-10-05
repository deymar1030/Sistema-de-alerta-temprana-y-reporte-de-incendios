import { SesionEntity } from "../../../domain/sesion/entities/sesion.entity.js";
import { SessionToken } from "../../../config/sessionToken.js";

const DIAS_RETENCION = 7;

// Siempre genera un identificador nuevo en el servidor (evita fijacion de sesion).
export default class CreateSesionUseCase {
  constructor(sesionRepository, { ttlHoras }) {
    this.sesionRepository = sesionRepository;
    this.ttlHoras = ttlHoras;
  }

  async execute({ id_usuario, dispositivo = null, ip_origen = null }) {
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
        dispositivo: dispositivo ? String(dispositivo).slice(0, 150) : null,
        ip_origen,
        creada_en: ahora,
        ultima_actividad: ahora,
        expira_en: new Date(ahora.getTime() + this.ttlHoras * 60 * 60 * 1000),
        revocada_en: null,
      })
    );

    return { token, sesion };
  }
}
