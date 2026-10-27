export default class GetSesionesActivasUseCase {
  constructor(sesionRepository) {
    this.sesionRepository = sesionRepository;
  }

  async execute(id_usuario) {
    return await this.sesionRepository.findActivasByUsuario(id_usuario, new Date());
  }
}
