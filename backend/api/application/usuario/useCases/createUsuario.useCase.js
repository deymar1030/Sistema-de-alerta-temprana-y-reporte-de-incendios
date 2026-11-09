import { CreateUsuarioDTO } from "../../../domain/usuario/dtos/createUsuario.dto.js";
import { UsuarioEntity } from "../../../domain/usuario/entities/usuario.entity.js";
import { Hash } from "../../../config/hash.js";

export default class CreateUsuarioUseCase {
  constructor({ usuarioRepository, rolRepository }) {
    this.usuarioRepository = usuarioRepository;
    this.rolRepository = rolRepository;
  }

  // id_usuario_actor: quien esta autenticado y crea este usuario (null si no
  // aplica, ej. autoregistro publico). Se reenvia a rolRepository para que
  // trg_historial_rol sepa a quien atribuir la creacion del rol, si hace
  // falta crear uno nuevo -- ver conUsuarioActual.js.
  async execute(usuarioData, id_usuario_actor = null) {
    const { nombre_rol, ...datos } = usuarioData;
    if (nombre_rol) {
      const rol = await this.rolRepository.findOrCreateByNombre(nombre_rol, id_usuario_actor);
      datos.id_rol = rol.id_rol;
    }

    const errors = CreateUsuarioDTO.validate(datos);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const usuarioDTO = new CreateUsuarioDTO({
      ...datos,
      contrasena: await Hash.hash(datos.contrasena),
    });

    const usuarioEntity = new UsuarioEntity({
      id_usuario: null,
      ...usuarioDTO,
    });

    return await this.usuarioRepository.create(usuarioEntity, id_usuario_actor);
  }
}
