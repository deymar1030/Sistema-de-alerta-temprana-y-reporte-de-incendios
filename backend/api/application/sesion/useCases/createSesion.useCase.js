import { SesionEntity } from "../../../domain/sesion/entities/sesion.entity.js";
import { SessionToken } from "../../../config/sessionToken.js";
import { MFA_PENDIENTE_TTL_MS } from "../../../config/mfaPendiente.js";

const DIAS_RETENCION = 7;

export default class CreateSesionUseCase {
  constructor(sesionRepository, { ttlHoras }) {
    this.sesionRepository = sesionRepository;
    this.ttlHoras = ttlHoras;
  }

  // mfaPendiente: la cuenta exige un segundo factor (rol.mfa_obligatorio) que
  // todavia no se valido. La sesion dura muy poco y requireAuth normal la
  // rechaza -- solo las rutas de /auth/mfa la aceptan (ver requireAuth.middleware.js).
  async execute({ id_usuario, mfaPendiente = false }) {
    const ahora = new Date();
    const token = SessionToken.generate();

    await this.sesionRepository.purgeAntiguas(
      id_usuario,
      new Date(ahora.getTime() - DIAS_RETENCION * 24 * 60 * 60 * 1000)
    );

    const ttlMs = mfaPendiente ? MFA_PENDIENTE_TTL_MS : this.ttlHoras * 60 * 60 * 1000;

    const sesion = await this.sesionRepository.create(
      new SesionEntity({
        id_sesion: null,
        id_usuario,
        token_hash: SessionToken.hash(token),
        expira_en: new Date(ahora.getTime() + ttlMs),
        mfa_pendiente: mfaPendiente,
      })
    );

    return { token, sesion };
  }
}
