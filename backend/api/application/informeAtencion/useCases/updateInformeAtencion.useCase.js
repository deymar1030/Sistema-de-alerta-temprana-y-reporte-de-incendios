import { UpdateInformeAtencionDTO } from "../../../domain/informeAtencion/dtos/updateInformeAtencion.dto.js";

export default class UpdateInformeAtencionUseCase {
  constructor(informeAtencionRepository) {
    this.informeAtencionRepository = informeAtencionRepository;
  }

  async execute(id, informeData) {
    const errors = UpdateInformeAtencionDTO.validate(id, informeData);
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    const informeDTO = new UpdateInformeAtencionDTO(informeData);
    return await this.informeAtencionRepository.update(Number(id), informeDTO);
  }
}
