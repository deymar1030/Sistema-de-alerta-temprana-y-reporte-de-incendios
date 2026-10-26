export default class GetMapaAlertaUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(filters) {
    return await this.alertaRepository.findMapa(filters);
  }
}
