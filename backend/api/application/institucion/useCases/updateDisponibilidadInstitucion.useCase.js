import { UpdateDisponibilidadInstitucionDTO } from "../../../domain/institucion/dtos/updateDisponibilidadInstitucion.dto.js";

export default class UpdateDisponibilidadInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id, data, jefe) {
    const errors = UpdateDisponibilidadInstitucionDTO.validate(id, data);
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    if (jefe && String(jefe.id_institucion) !== String(id)) {
      throw new Error("No puedes cambiar la disponibilidad de otra institucion");
    }

    const existente = await this.institucionRepository.findById(id);
    if (!existente) throw new Error("Institucion not found");

    const dto = new UpdateDisponibilidadInstitucionDTO(data);
    return await this.institucionRepository.update(id, dto);
  }
}
