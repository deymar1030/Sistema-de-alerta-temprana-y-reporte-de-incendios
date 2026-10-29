import { UpdateInformeAtencionDTO } from "../../../domain/informeAtencion/dtos/updateInformeAtencion.dto.js";

export default class UpdateInformeAtencionUseCase {
  constructor(informeAtencionRepository) {
    this.informeAtencionRepository = informeAtencionRepository;
  }

  async execute(id, informeData, usuario) {
    const errors = UpdateInformeAtencionDTO.validate(id, informeData);
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    const existing = await this.informeAtencionRepository.findById(Number(id));
    if (!existing) throw new Error("Informe de atencion not found");
    if (usuario && String(existing.id_institucion) !== String(usuario.id_institucion)) {
      throw new Error("No puedes modificar un informe de otra institucion");
    }

    const informeDTO = new UpdateInformeAtencionDTO(informeData);
    // Solo la transicion a COMPLETADO cierra la alerta; pedirlo de nuevo
    // sobre un informe ya COMPLETADO es idempotente (no la reabre).
    const { informe } = await this.informeAtencionRepository.actualizarYEvaluarCierre(Number(id), informeDTO, {
      id_alerta: existing.id_alerta,
      yaCompletado: existing.estado === "COMPLETADO",
    });
    return informe;
  }
}
