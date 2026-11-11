import { AuthErrors } from "../../../domain/auth/errors/authError.js";
import { Totp } from "../../../config/totp.js";

// Cubre tanto la confirmacion del primer codigo tras IniciarMfaUseCase (la
// cuenta todavia no tiene mfa_habilitado=true) como la verificacion de login
// de una cuenta que ya completo el enrolamiento: en ambos casos se valida el
// mismo codigo TOTP contra usuario.mfa_secreto. Si es valido, "sube de
// categoria" la sesion pendiente a una sesion completa.
export default class VerificarMfaUseCase {
  constructor({ usuarioRepository, sesionRepository }, { ttlHoras }) {
    this.usuarioRepository = usuarioRepository;
    this.sesionRepository = sesionRepository;
    this.ttlHoras = ttlHoras;
  }

  async execute({ usuario, sesion, codigo }) {
    if (!usuario.mfa_secreto || !(await Totp.verificar(codigo, usuario.mfa_secreto))) {
      throw AuthErrors.mfaInvalido();
    }

    if (!usuario.mfa_habilitado) {
      await this.usuarioRepository.habilitarMfa(usuario.id_usuario);
    }

    const expira_en = new Date(Date.now() + this.ttlHoras * 60 * 60 * 1000);
    await this.sesionRepository.confirmarMfa(sesion.id_sesion, expira_en);
  }
}
