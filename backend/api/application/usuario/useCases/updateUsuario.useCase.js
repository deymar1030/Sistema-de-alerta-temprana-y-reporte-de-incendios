import { UpdateUsuarioDTO } from "../../../domain/usuario/dtos/updateUsuario.dto.js";

export default class UpdateUsuarioUseCase {
  constructor({ usuarioRepository, rolRepository }) {
    this.usuarioRepository = usuarioRepository;
    this.rolRepository = rolRepository;
  }

  async execute(id, usuarioData) {
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
      const rol = await this.rolRepository.findOrCreateByNombre(nombre_rol);
      datos.id_rol = rol.id_rol;
    }

    const usuarioDTO = new UpdateUsuarioDTO(datos);

    return await this.usuarioRepository.update(id, usuarioDTO);
  }
}
