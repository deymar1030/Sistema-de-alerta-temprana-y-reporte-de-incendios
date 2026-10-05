export default class GetAllUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute() {
    return await this.usuarioRepository.findAll();
  }
}
