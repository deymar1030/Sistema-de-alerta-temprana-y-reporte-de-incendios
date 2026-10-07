import { LoginDTO } from "../../../domain/auth/dtos/login.dto.js";
import { AuthError, AuthErrors } from "../../../domain/auth/errors/authError.js";
import { Hash } from "../../../config/hash.js";

const DUMMY_HASH = Hash.hash("contrasena-de-relleno-no-valida");

export default class AuthenticateUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async execute(credenciales) {
    const errors = LoginDTO.validate(credenciales);
    if (errors.length > 0) {
      throw new AuthError(`Validation errors: ${errors.join(", ")}`, {
        status: 400,
        code: "VALIDATION_ERROR",
      });
    }

    const { correo, contrasena } = new LoginDTO(credenciales);
    const usuario = await this.authRepository.findByCorreo(correo.trim());

    if (!usuario) {
      await Hash.compare(contrasena, await DUMMY_HASH);
      throw AuthErrors.invalidCredentials();
    }

    const hashGuardado = usuario.contrasena || (await DUMMY_HASH);
    const esValida = (await Hash.compare(contrasena, hashGuardado)) && Boolean(usuario.contrasena);

    if (!esValida) {
      throw AuthErrors.invalidCredentials();
    }

    return usuario;
  }
}
