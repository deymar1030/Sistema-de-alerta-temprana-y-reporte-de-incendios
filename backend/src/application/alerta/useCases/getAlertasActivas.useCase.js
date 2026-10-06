export default class GetAlertasActivasUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute() {
    return await this.alertaRepository.findActive();
  }
}