export default class GetMapaPredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute() {
    return await this.predioRepository.findMapa();
  }
}
