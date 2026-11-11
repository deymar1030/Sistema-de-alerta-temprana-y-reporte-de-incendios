export default class GetAllAuditoriaUseCase {
  constructor(auditoriaRepository) {
    this.auditoriaRepository = auditoriaRepository;
  }

  async execute(filters) {
    return await this.auditoriaRepository.findAll(filters);
  }
}
