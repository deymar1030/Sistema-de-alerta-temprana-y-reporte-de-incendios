import { CreateNotificacionDTO } from "../../../domain/notificacion/dtos/createNotificacion.dto.js";
import { NotificacionEntity } from "../../../domain/notificacion/entities/notificacion.entity.js";

export default class CreateNotificacionUseCase {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(notificacionData) {
    const errors = CreateNotificacionDTO.validate(notificacionData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const notificacionDTO = new CreateNotificacionDTO(notificacionData);

    const notificacionEntity = new NotificacionEntity({
      id_notificacion: null,
      fecha_hora: null,
      leida: false,
      ...notificacionDTO,
    });

    return await this.notificacionRepository.create(notificacionEntity);
  }
}
