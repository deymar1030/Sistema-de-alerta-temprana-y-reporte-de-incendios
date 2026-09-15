export default class GetAllUbicacionGeograficaUseCase {
  constructor(ubicacionGeograficaRepository) {
    this.ubicacionGeograficaRepository = ubicacionGeograficaRepository;
  }

  async execute() {
    return await this.ubicacionGeograficaRepository.findAll();
  }
}