import { RegisterDTO } from "../../../domain/auth/dtos/register.dto.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";
import { AuthErrors } from "../../../domain/auth/errors/authError.js";
import { Hash } from "../../../config/hash.js";

// Auto-registro publico: siempre crea el usuario con rol CIUDADANO (fijo en
// el dominio, no lo decide quien llama). Para otros roles se usa POST /usuarios
// autenticado como ADMIN.
export default class RegisterUseCase {
  constructor({ authRepository, usuarioRepository, rolRepository }) {
    this.authRepository = authRepository;
    this.usuarioRepository = usuarioRepository;
    this.rolRepository = rolRepository;
  }

  async execute(data) {
    const errors = RegisterDTO.validate(data);
    if (errors.length > 0) {
      throw AuthErrors.validationError(`Validation errors: ${errors.join(", ")}`);
    }

    const registroDTO = new RegisterDTO(data);

    const existente = await this.authRepository.findByCorreo(registroDTO.correo);
    if (existente) {
      throw AuthErrors.correoYaRegistrado();
    }

    const rol = await this.rolRepository.findOrCreateByNombre(RolNombres.CIUDADANO);
    const contrasenaHash = await Hash.hash(registroDTO.contrasena);

    return await this.usuarioRepository.create({
      id_rol: rol.id_rol,
      id_institucion: null,
      nombre: registroDTO.nombre,
      primer_apellido: registroDTO.primer_apellido,
      segundo_apellido: registroDTO.segundo_apellido,
      telefono: registroDTO.telefono,
      correo: registroDTO.correo,
      contrasena: contrasenaHash,
    });
  }
}
