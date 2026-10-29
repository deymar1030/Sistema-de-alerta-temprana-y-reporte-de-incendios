export default class GetAllAuditoriaUsuarioUseCase {
  constructor(auditoriaRepository) {
    this.auditoriaRepository = auditoriaRepository;
  }

  async execute(filters) {
    return await this.auditoriaRepository.findAllUsuario(filters);
  }
}
