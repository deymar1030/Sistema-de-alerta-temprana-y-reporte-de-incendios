export default class GetSesionesActivasUseCase {
  constructor(sesionRepository, { inactividadMinutos }) {
    this.sesionRepository = sesionRepository;
    this.inactividadMs = inactividadMinutos * 60 * 1000;
  }

  async execute(id_usuario) {
    const ahora = new Date();

    return await this.sesionRepository.findActivasByUsuario(id_usuario, {
      ahora,
      limiteInactividad: new Date(ahora.getTime() - this.inactividadMs),
    });
  }
}
