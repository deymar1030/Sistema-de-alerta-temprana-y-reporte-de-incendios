export default class GetAllInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(filters) {
    return await this.institucionRepository.findAll(filters);
  }
}
