export class NotificacionService {
  constructor({
    getAllNotificacionUseCase,
    countNoLeidasNotificacionUseCase,
    marcarLeidaNotificacionUseCase,
    marcarTodasLeidasNotificacionUseCase,
  }) {
    this.getAllNotificacionUseCase = getAllNotificacionUseCase;
    this.countNoLeidasNotificacionUseCase = countNoLeidasNotificacionUseCase;
    this.marcarLeidaNotificacionUseCase = marcarLeidaNotificacionUseCase;
    this.marcarTodasLeidasNotificacionUseCase = marcarTodasLeidasNotificacionUseCase;
  }

  async getAll(id_usuario, filters) {
    return await this.getAllNotificacionUseCase.execute(id_usuario, filters);
  }

  async countNoLeidas(id_usuario) {
    return await this.countNoLeidasNotificacionUseCase.execute(id_usuario);
  }

  async marcarLeida(id, id_usuario) {
    return await this.marcarLeidaNotificacionUseCase.execute(id, id_usuario);
  }

  async marcarTodasLeidas(id_usuario) {
    return await this.marcarTodasLeidasNotificacionUseCase.execute(id_usuario);
  }
}
