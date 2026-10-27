import { GetNotificacionDTO } from "../../../domain/notificacion/dtos/getNotificacion.dto.js";

export default class MarcarLeidaNotificacionUseCase {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(id, id_usuario) {
    const errors = GetNotificacionDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existing = await this.notificacionRepository.findByIdForUsuario(id, id_usuario);
    if (!existing) {
      throw new Error("Notificacion not found");
    }

    return await this.notificacionRepository.marcarLeida(id);
  }
}
