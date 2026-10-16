export default class CountNoLeidasNotificacionUseCase {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(id_usuario) {
    return await this.notificacionRepository.countNoLeidas(id_usuario);
  }
}
