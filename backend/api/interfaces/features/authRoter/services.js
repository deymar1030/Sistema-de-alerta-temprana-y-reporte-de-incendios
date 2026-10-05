export class AuthService {
  constructor({
    authenticateUseCase,
    createSesionUseCase,
    validateSesionUseCase,
    revokeSesionUseCase,
    getSesionesActivasUseCase,
  }) {
    this.authenticateUseCase = authenticateUseCase;
    this.createSesionUseCase = createSesionUseCase;
    this.validateSesionUseCase = validateSesionUseCase;
    this.revokeSesionUseCase = revokeSesionUseCase;
    this.getSesionesActivasUseCase = getSesionesActivasUseCase;
  }

  // Autenticacion (quien es) y luego sesion (mantenerlo autenticado).
  async login(credenciales, { dispositivo, ip_origen }, tokenAnterior) {
    const usuario = await this.authenticateUseCase.execute(credenciales);

    await this.#descartarSesionAnterior(tokenAnterior);

    const { token } = await this.createSesionUseCase.execute({
      id_usuario: usuario.id_usuario,
      dispositivo,
      ip_origen,
    });

    return { usuario, token };
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

  // Evita fijacion de sesion: al iniciar sesion se descarta cualquier sesion
  // que el navegador ya tuviera, y se emite un identificador nuevo.
  async #descartarSesionAnterior(tokenAnterior) {
    if (!tokenAnterior) return;

    try {
      const { sesion } = await this.validateSesionUseCase.execute(tokenAnterior);
      await this.revokeSesionUseCase.execute({
        id_sesion: sesion.id_sesion,
        id_usuario: sesion.id_usuario,
      });
    } catch {
      // Cookie invalida o vencida: no hay nada que descartar.
    }
  }
}
