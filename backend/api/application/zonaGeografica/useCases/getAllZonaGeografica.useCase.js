export default class GetAllZonaGeograficaUseCase {
  constructor(zonaGeograficaRepository) {
    this.zonaGeograficaRepository = zonaGeograficaRepository;
  }

  async execute() {
    return await this.zonaGeograficaRepository.findAll();
  }
}
