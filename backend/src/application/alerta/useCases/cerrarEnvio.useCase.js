import { UpdateEstadoEnvioDTO } from "../../../domain/alerta/dtos/updateEstadoEnvio.dto.js";

export default class CerrarEnvioUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(id_alerta, id_institucion) {
    const errors = UpdateEstadoEnvioDTO.validate(
      id_alerta,
      id_institucion
    );

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const envio = await this.alertaRepository.findEnvio(
      id_alerta,
      id_institucion
    );

    if (!envio) {
      throw new Error("Envio not found");
    }

    return await this.alertaRepository.updateEnvioEstado(
      id_alerta,
      id_institucion,
      "CERRADA"
    );
  }
}