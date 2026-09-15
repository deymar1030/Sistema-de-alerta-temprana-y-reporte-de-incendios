import { UpdateUsuarioDTO } from "../../../domain/usuario/dtos/updateUsuario.dto.js";
import { Hash } from "../../../config/hash.js";

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

    const contrasena = usuarioData.contrasena
      ? await Hash.hash(usuarioData.contrasena)
      : existingUsuario.contrasena;

    const usuarioDTO = new UpdateUsuarioDTO({
      ...usuarioData,
      contrasena,
    });

    return await this.usuarioRepository.update(id, usuarioDTO);
  }
}
