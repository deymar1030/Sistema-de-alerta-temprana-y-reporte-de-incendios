import { Validators } from "../../../config/validators.js";

export default class GetAlertaUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(id) {
    if (!Validators.isValidId(id)) throw new Error("ID not valid");

    const alerta = await this.alertaRepository.findById(Number(id));
    if (!alerta) throw new Error("Alerta not found");

    const [predio, lecturas, instituciones_notificadas, reporte_origen] = await Promise.all([
      this.alertaRepository.findPredioByAlerta(alerta.id_alerta),
      this.alertaRepository.findLecturasByAlerta(alerta.id_alerta),
      this.alertaRepository.findInstitucionesNotificadas(alerta.id_alerta),
      this.alertaRepository.findReporteOrigen(alerta.id_alerta),
    ]);

    return { alerta, predio, lecturas, instituciones_notificadas, reporte_origen };
  }
}
