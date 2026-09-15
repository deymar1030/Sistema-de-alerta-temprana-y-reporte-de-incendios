import { UpdateUsuarioDTO } from "../../../domain/usuario/dtos/updateUsuario.dto.js";

export default class UpdateUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id, usuarioData) {
    const errors = UpdateUsuarioDTO.validate(id, usuarioData);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingUsuario = await this.usuarioRepository.findById(id);

    if (!existingUsuario) {
      throw new Error("Usuario not found");
    }

    const usuarioDTO = new UpdateUsuarioDTO({
      ...usuarioData,
      contrasena: usuarioData.contrasena || existingUsuario.contrasena,
    });

    return await this.usuarioRepository.update(id, usuarioDTO);
  }
}
