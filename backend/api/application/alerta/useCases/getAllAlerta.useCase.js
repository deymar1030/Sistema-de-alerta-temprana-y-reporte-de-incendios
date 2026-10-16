export default class GetAllAlertaUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(filters) {
    return await this.alertaRepository.findAll(filters);
  }
}
