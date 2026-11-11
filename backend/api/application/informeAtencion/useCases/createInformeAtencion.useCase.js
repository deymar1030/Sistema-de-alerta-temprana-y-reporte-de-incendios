import { CreateInformeAtencionDTO } from "../../../domain/informeAtencion/dtos/createInformeAtencion.dto.js";
import { notificarCierreAlerta } from "../notificarCierreAlerta.js";

export default class CreateInformeAtencionUseCase {
  constructor({ informeAtencionRepository, reporteURepository, notificacionRepository, realtimeNotifier }) {
    this.informeAtencionRepository = informeAtencionRepository;
    this.reporteURepository = reporteURepository;
    this.notificacionRepository = notificacionRepository;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute(informeData) {
    const errors = CreateInformeAtencionDTO.validate(informeData);
    if (errors.length > 0) throw new Error(`Validation errors: ${errors.join(", ")}`);

    const informeDTO = new CreateInformeAtencionDTO(informeData);
    // Crea en una sola transaccion y, si nace ya COMPLETADO, cierra la
    // alerta (ver cerrarAlertaPorInforme en el repositorio).
    const { informe, alerta_actualizada } = await this.informeAtencionRepository.crearYEvaluarCierre(informeDTO);
    await notificarCierreAlerta(alerta_actualizada, this);
    return informe;
  }
}
