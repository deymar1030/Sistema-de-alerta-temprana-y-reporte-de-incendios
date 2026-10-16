import { Validators } from "../../../config/validators.js";

export default class DesactivarUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id) {
    if (!Validators.isValidId(id)) {
      throw new Error("Validation errors: ID not valid");
    }

    const existente = await this.usuarioRepository.findById(id);
    if (!existente) {
      throw new Error("Usuario not found");
    }

    return await this.usuarioRepository.desactivar(id);
  }
}
