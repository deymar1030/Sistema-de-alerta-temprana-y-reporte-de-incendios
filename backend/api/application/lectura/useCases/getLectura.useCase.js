import { Validators } from "../../../config/validators.js";

export default class GetLecturaUseCase {
  constructor(lecturaRepository) {
    this.lecturaRepository = lecturaRepository;
  }

  async execute(id) {
    if (!Validators.isValidId(id)) throw new Error("ID not valid");

    const lectura = await this.lecturaRepository.findById(Number(id));
    if (!lectura) throw new Error("Lectura not found");

    return lectura;
  }
}
