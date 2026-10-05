import { LoginDTO } from "../../../domain/auth/dtos/login.dto.js";
import { AuthError, AuthErrors } from "../../../domain/auth/errors/authError.js";
import { Hash } from "../../../config/hash.js";

// Se compara contra este hash cuando el correo no existe, para que la
// respuesta tarde lo mismo y no se pueda averiguar que correos estan registrados.
const DUMMY_HASH = Hash.hash("contrasena-de-relleno-no-valida");

// Autenticacion: solo responde "quien es este usuario". No crea sesiones.
export default class AuthenticateUseCase {
  constructor(authRepository, { maxIntentos, bloqueoMinutos }) {
    this.authRepository = authRepository;
    this.maxIntentos = maxIntentos;
    this.bloqueoMinutos = bloqueoMinutos;
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

    const ahora = new Date();
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > ahora) {
      throw AuthErrors.accountLocked();
    }

    const hashGuardado = usuario.contrasena || (await DUMMY_HASH);
    const esValida = (await Hash.compare(contrasena, hashGuardado)) && Boolean(usuario.contrasena);

    if (!esValida) {
      const intentos = await this.authRepository.incrementarIntentosFallidos(usuario.id_usuario);
      if (intentos >= this.maxIntentos) {
        const hasta = new Date(ahora.getTime() + this.bloqueoMinutos * 60 * 1000);
        await this.authRepository.bloquearHasta(usuario.id_usuario, hasta);
      }
      throw AuthErrors.invalidCredentials();
    }

    if (usuario.intentos_fallidos > 0 || usuario.bloqueado_hasta) {
      await this.authRepository.limpiarIntentos(usuario.id_usuario);
    }

    return usuario;
  }
}
