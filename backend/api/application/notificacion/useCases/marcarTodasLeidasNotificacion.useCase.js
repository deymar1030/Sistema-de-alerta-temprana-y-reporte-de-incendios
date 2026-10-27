export default class MarcarTodasLeidasNotificacionUseCase {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(id_usuario) {
    return await this.notificacionRepository.marcarTodasLeidas(id_usuario);
  }
}
