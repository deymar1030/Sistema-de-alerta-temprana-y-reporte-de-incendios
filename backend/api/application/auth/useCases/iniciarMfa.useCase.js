import { Totp } from "../../../config/totp.js";

// Se llama con la sesion "pendiente de MFA" ya validada (ver
// requireAuth.middleware.js). Genera un secreto nuevo y lo guarda sin
// habilitar: solo queda activo tras confirmarlo con un codigo valido en
// VerificarMfaUseCase. Es seguro llamarla de nuevo (ej. el usuario cerro la
// app antes de escanear el QR): se sobreescribe el secreto anterior.
export default class IniciarMfaUseCase {
  constructor({ usuarioRepository }) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(usuario) {
    const secreto = Totp.generarSecreto();
    await this.usuarioRepository.guardarSecretoMfa(usuario.id_usuario, secreto);

    return { secreto, uri: Totp.generarUri(secreto, usuario.correo) };
  }
}
