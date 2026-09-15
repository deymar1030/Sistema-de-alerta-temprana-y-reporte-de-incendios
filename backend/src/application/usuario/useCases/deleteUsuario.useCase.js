import { DeleteUsuarioDTO } from "../../../domain/usuario/dtos/deleteUsuario.dto.js";

export default class DeleteUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id) {
    const errors = DeleteUsuarioDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingUsuario = await this.usuarioRepository.findById(id);

    if (!existingUsuario) {
      throw new Error("Usuario not found");
    }

    return await this.usuarioRepository.delete(id);
  }
}
