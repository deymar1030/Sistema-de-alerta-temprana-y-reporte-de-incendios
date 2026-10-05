import { GetUsuarioDTO } from "../../../domain/usuario/dtos/getUsuario.dto.js";

export default class GetUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id) {
    const errors = GetUsuarioDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const usuario = await this.usuarioRepository.findById(id);

    if (!usuario) {
      throw new Error("Usuario not found");
    }

    return usuario;
  }
}
