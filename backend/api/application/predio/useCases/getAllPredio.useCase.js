export default class GetAllPredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute(filters) {
    return await this.predioRepository.findAll(filters);
  }
}
