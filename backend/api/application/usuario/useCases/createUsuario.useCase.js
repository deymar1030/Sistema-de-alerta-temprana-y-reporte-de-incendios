import { CreateUsuarioDTO } from "../../../domain/usuario/dtos/createUsuario.dto.js";
import { UsuarioEntity } from "../../../domain/usuario/entities/usuario.entity.js";
import { Hash } from "../../../config/hash.js";

export default class CreateUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(usuarioData) {
    const errors = CreateUsuarioDTO.validate(usuarioData);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const usuarioDTO = new CreateUsuarioDTO({
      ...usuarioData,
      contrasena: await Hash.hash(usuarioData.contrasena),
    });

    const usuarioEntity = new UsuarioEntity({
      id_usuario: null,
      ...usuarioDTO,
    });

    return await this.usuarioRepository.create(usuarioEntity);
  }
}
