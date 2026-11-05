import { LoginDTO } from "../../../domain/auth/dtos/login.dto.js";
import { AuthError, AuthErrors } from "../../../domain/auth/errors/authError.js";
import { Hash } from "../../../config/hash.js";

const DUMMY_HASH = Hash.hash("contrasena-de-relleno-no-valida");

export default class AuthenticateUseCase {
  constructor({ authRepository, usuarioRepository, politicaRepository, sesionRepository }) {
    this.authRepository = authRepository;
    this.usuarioRepository = usuarioRepository;
    this.politicaRepository = politicaRepository;
    this.sesionRepository = sesionRepository;
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

    // Bloqueo por intentos fallidos: afecta a la cuenta en general, incluso
    // con la contrasena correcta, hasta que venza bloqueado_hasta (ver
    // docs/PoliticaLockout.md).
    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      throw AuthErrors.cuentaBloqueada();
    }

    const hashGuardado = usuario.contrasena || (await DUMMY_HASH);
    const esValida = (await Hash.compare(contrasena, hashGuardado)) && Boolean(usuario.contrasena);

    if (!esValida) {
      await this.#registrarIntentoFallido(usuario);
      throw AuthErrors.invalidCredentials();
    }

    if (usuario.fecha_eliminacion || !usuario.estado) {
      throw AuthErrors.cuentaDesactivada();
    }

    if (usuario.intentos_fallidos > 0) {
      await this.usuarioRepository.resetearIntentos(usuario.id_usuario);
    }

    return usuario;
  }

  // Sin politica asociada al rol -> sin limite de intentos (fallback decidido
  // en docs/PoliticaLockout.md §5). Al llegar al umbral, bloquea la cuenta
  // completa y revoca sus sesiones ya abiertas, no solo los logins nuevos.
  async #registrarIntentoFallido(usuario) {
    const politica = await this.politicaRepository.findEfectivaByRol(usuario.id_rol);
    if (!politica) return;

    const intentos = await this.usuarioRepository.incrementarIntentosFallidos(usuario.id_usuario);
    if (intentos < politica.max_intentos_fallidos) return;

    const bloqueado_hasta = new Date(Date.now() + politica.tiempo_bloqueo_minutos * 60 * 1000);
    await this.usuarioRepository.bloquear(usuario.id_usuario, bloqueado_hasta);
    await this.sesionRepository.revokeAllByUsuario(usuario.id_usuario);
  }
}
