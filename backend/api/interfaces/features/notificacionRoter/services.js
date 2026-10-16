export class NotificacionService {
  constructor({
    getAllNotificacionUseCase,
    countNoLeidasNotificacionUseCase,
    marcarLeidaNotificacionUseCase,
    marcarTodasLeidasNotificacionUseCase,
    asignarAlertaOperativosUseCase,
  }) {
    this.getAllNotificacionUseCase = getAllNotificacionUseCase;
    this.countNoLeidasNotificacionUseCase = countNoLeidasNotificacionUseCase;
    this.marcarLeidaNotificacionUseCase = marcarLeidaNotificacionUseCase;
    this.marcarTodasLeidasNotificacionUseCase = marcarTodasLeidasNotificacionUseCase;
    this.asignarAlertaOperativosUseCase = asignarAlertaOperativosUseCase;
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

  async asignarAlerta({ id_alerta, id_usuarios, jefe }) {
    return await this.asignarAlertaOperativosUseCase.execute({ id_alerta, id_usuarios, jefe });
  }
}
