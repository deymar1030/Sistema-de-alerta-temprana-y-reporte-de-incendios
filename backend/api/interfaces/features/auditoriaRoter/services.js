export class AuditoriaService {
  constructor({ getAllAuditoriaUseCase, getAllAuditoriaUsuarioUseCase }) {
    this.getAllAuditoriaUseCase = getAllAuditoriaUseCase;
    this.getAllAuditoriaUsuarioUseCase = getAllAuditoriaUsuarioUseCase;
  }

  async getAll(filters) {
    return await this.getAllAuditoriaUseCase.execute(filters);
  }

  async getAllUsuario(filters) {
    return await this.getAllAuditoriaUsuarioUseCase.execute(filters);
  }
}
