import { Validators } from "../../../config/validators.js";

export default class RecibirEnvioUseCase {
  constructor(enviaRepository) {
    this.enviaRepository = enviaRepository;
  }

  async execute(id_alerta, id_institucion) {
    if (!Validators.isValidId(id_alerta) || !Validators.isValidId(id_institucion)) {
      throw new Error("ID not valid");
    }

    const envio = await this.enviaRepository.findByIds(Number(id_alerta), Number(id_institucion));
    if (!envio) throw new Error("Envio not found");

    return await this.enviaRepository.updateEstado(Number(id_alerta), Number(id_institucion), "RECIBIDA");
  }
}
