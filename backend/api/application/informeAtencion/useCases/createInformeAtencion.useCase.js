import { CreateInformeAtencionDTO } from "../../../domain/informeAtencion/dtos/createInformeAtencion.dto.js";

export default class CreateInformeAtencionUseCase {
  constructor(informeAtencionRepository) {
    this.informeAtencionRepository = informeAtencionRepository;
  }

  async execute(informeData) {
    const errors = CreateInformeAtencionDTO.validate(informeData);
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    const informeDTO = new CreateInformeAtencionDTO(informeData);
    // Crea en una sola transaccion y, si nace ya COMPLETADO, cierra la
    // alerta (ver cerrarAlertaPorInforme en el repositorio).
    const { informe } = await this.informeAtencionRepository.crearYEvaluarCierre(informeDTO);
    return informe;
  }
}
