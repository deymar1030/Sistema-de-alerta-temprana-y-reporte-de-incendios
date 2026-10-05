export default class GetAllInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute() {
    return await this.institucionRepository.findAll();
  }
}