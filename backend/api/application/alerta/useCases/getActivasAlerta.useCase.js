export default class GetActivasAlertaUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(filters) {
    return await this.alertaRepository.findActivas(filters);
  }
}
