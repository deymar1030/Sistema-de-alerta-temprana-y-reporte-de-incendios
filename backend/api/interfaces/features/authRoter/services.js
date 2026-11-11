export class AuthService {
  constructor({
    authenticateUseCase,
    registerUseCase,
    createSesionUseCase,
    validateSesionUseCase,
    revokeSesionUseCase,
    getSesionesActivasUseCase,
    iniciarMfaUseCase,
    verificarMfaUseCase,
  }) {
    this.authenticateUseCase = authenticateUseCase;
    this.registerUseCase = registerUseCase;
    this.createSesionUseCase = createSesionUseCase;
    this.validateSesionUseCase = validateSesionUseCase;
    this.revokeSesionUseCase = revokeSesionUseCase;
    this.getSesionesActivasUseCase = getSesionesActivasUseCase;
    this.iniciarMfaUseCase = iniciarMfaUseCase;
    this.verificarMfaUseCase = verificarMfaUseCase;
  }

  async register(data) {
    return await this.registerUseCase.execute(data);
  }

  async login(credenciales, tokenAnterior) {
    const usuario = await this.authenticateUseCase.execute(credenciales);

    await this.#descartarSesionAnterior(tokenAnterior);

    // rol.mfa_obligatorio: la cuenta no recibe una sesion completa todavia,
    // solo una "pendiente de MFA" (ver createSesion.useCase.js) hasta que
    // pase por /auth/mfa/configurar o /auth/mfa/verificar.
    if (usuario.rol?.mfa_obligatorio) {
      const { token } = await this.createSesionUseCase.execute({
        id_usuario: usuario.id_usuario,
        mfaPendiente: true,
      });

      return {
        usuario: null,
        token,
        mfa: usuario.mfa_habilitado ? "VERIFICACION_REQUERIDA" : "CONFIGURACION_REQUERIDA",
      };
    }

    const { token } = await this.createSesionUseCase.execute({
      id_usuario: usuario.id_usuario,
    });

    return { usuario, token, mfa: null };
  }

  async configurarMfa(usuario) {
    return await this.iniciarMfaUseCase.execute(usuario);
  }

  async verificarMfa({ usuario, sesion }, codigo) {
    await this.verificarMfaUseCase.execute({ usuario, sesion, codigo });
    return usuario;
  }

  async logout({ sesion, usuario }) {
    await this.revokeSesionUseCase.execute({
      id_sesion: sesion.id_sesion,
      id_usuario: usuario.id_usuario,
    });
  }

  async getSesiones(id_usuario) {
    return await this.getSesionesActivasUseCase.execute(id_usuario);
  }

  async revokeSesion(id_sesion, id_usuario) {
    await this.revokeSesionUseCase.execute({ id_sesion, id_usuario });
  }

  async #descartarSesionAnterior(tokenAnterior) {
    if (!tokenAnterior) return;

    try {
      const { sesion } = await this.validateSesionUseCase.execute(tokenAnterior);
      await this.revokeSesionUseCase.execute({
        id_sesion: sesion.id_sesion,
        id_usuario: sesion.id_usuario,
      });
    } catch {}
  }
}
