export default class GetAllNotificacionUseCase {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(id_usuario, filters) {
    return await this.notificacionRepository.findAllByUsuario(id_usuario, filters);
  }
}
