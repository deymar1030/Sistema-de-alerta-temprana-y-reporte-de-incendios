export default class GetAllInformeAtencionUseCase {
  constructor(informeAtencionRepository) {
    this.informeAtencionRepository = informeAtencionRepository;
  }

  async execute(filters) {
    return await this.informeAtencionRepository.findAll(filters);
  }
}
