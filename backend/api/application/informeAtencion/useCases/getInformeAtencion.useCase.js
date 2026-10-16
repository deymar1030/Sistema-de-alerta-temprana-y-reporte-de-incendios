import { Validators } from "../../../config/validators.js";

export default class GetInformeAtencionUseCase {
  constructor(informeAtencionRepository) {
    this.informeAtencionRepository = informeAtencionRepository;
  }

  async execute(id) {
    if (!Validators.isValidId(id)) throw new Error("ID not valid");

    const informe = await this.informeAtencionRepository.findById(Number(id));
    if (!informe) throw new Error("Informe de atencion not found");

    return informe;
  }
}
