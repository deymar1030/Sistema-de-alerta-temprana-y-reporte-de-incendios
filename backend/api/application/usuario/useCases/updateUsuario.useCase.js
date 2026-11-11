import { UpdateUsuarioDTO } from "../../../domain/usuario/dtos/updateUsuario.dto.js";
import { Hash } from "../../../config/hash.js";

export default class UpdateUsuarioUseCase {
  constructor({ usuarioRepository, rolRepository }) {
    this.usuarioRepository = usuarioRepository;
    this.rolRepository = rolRepository;
  }

  // id_usuario_actor: quien esta autenticado y pide el cambio (null si no
  // aplica). ip_origen: la IP de esa peticion. Ambos se reenvian a los
  // repositorios para que los triggers de auditoria de BD
  // (trg_historial_rol, trg_escalada_privilegios) sepan a quien y desde
  // donde atribuirlo -- ver conUsuarioActual.js.
  async execute(id, usuarioData, id_usuario_actor = null, ip_origen = null) {
    const errors = UpdateUsuarioDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingUsuario = await this.usuarioRepository.findById(id);

    if (!existingUsuario) {
      throw new Error("Usuario not found");
    }

    const { nombre_rol, ...datos } = usuarioData;
    if (nombre_rol) {
      const rol = await this.rolRepository.findOrCreateByNombre(nombre_rol, id_usuario_actor, ip_origen);
      datos.id_rol = rol.id_rol;
    }

    if (datos.contrasena) {
      datos.contrasena = await Hash.hash(datos.contrasena);
    }

    const usuarioDTO = new UpdateUsuarioDTO(datos);

    return await this.usuarioRepository.update(id, usuarioDTO, id_usuario_actor, ip_origen);
  }
}
