export default class GetAllUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(filters) {
    return await this.usuarioRepository.findAll(filters);
  }
}
