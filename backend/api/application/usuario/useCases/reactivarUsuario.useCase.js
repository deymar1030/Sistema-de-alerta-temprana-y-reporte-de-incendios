import { Validators } from "../../../config/validators.js";

export default class ReactivarUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id, id_usuario_actor = null, ip_origen = null) {
    if (!Validators.isValidId(id)) {
      throw new Error("Validation errors: ID not valid");
    }

    const existente = await this.usuarioRepository.findById(id);
    if (!existente) {
      throw new Error("Usuario not found");
    }

    return await this.usuarioRepository.reactivar(id, id_usuario_actor, ip_origen);
  }
}
