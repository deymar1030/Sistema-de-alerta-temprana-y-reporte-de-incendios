import { UpdateEstadoReporteUDTO } from "../../../domain/reporteU/dtos/updateEstadoReporteU.dto.js";

const MENSAJES_ESTADO = {
  VALIDADO: "Tu reporte fue validado.",
  DESCARTADO: "Tu reporte fue descartado.",
  ATENDIDO: "Tu reporte fue atendido.",
};

export default class UpdateEstadoReporteUUseCase {
  constructor(reporteURepository, notificacionRepository, notifier) {
    this.reporteURepository = reporteURepository;
    this.notificacionRepository = notificacionRepository;
    this.notifier = notifier;
  }

  async execute(id, data) {
    const errors = UpdateEstadoReporteUDTO.validate(id, data);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existing = await this.reporteURepository.findById(id);
    if (!existing) {
      throw new Error("Reporte de usuario not found");
    }

    const { estado } = new UpdateEstadoReporteUDTO(data);

    const actualizado = await this.reporteURepository.updateEstado(id, estado);

    const mensaje = MENSAJES_ESTADO[estado];
    if (mensaje && this.notificacionRepository && this.notifier) {
      const notificacion = await this.notificacionRepository.create({
        id_usuario: existing.id_usuario,
        id_alerta: null,
        tipo: "REPORTE",
        titulo: "Actualización de tu reporte",
        mensaje,
      });
      await this.notifier.emitNotificacion(notificacion);
    }

    return actualizado;
  }
}
