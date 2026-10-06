export class AlertaService {
  constructor({
    getAllAlertasUseCase,
    getAlertaUseCase,
    getAlertasActivasUseCase,
    marcarEnvioRecibidoUseCase,
    marcarEnvioAtendidoUseCase,
    cerrarEnvioUseCase,
  }) {
    this.getAllAlertasUseCase = getAllAlertasUseCase;
    this.getAlertaUseCase = getAlertaUseCase;
    this.getAlertasActivasUseCase = getAlertasActivasUseCase;
    this.marcarEnvioRecibidoUseCase = marcarEnvioRecibidoUseCase;
    this.marcarEnvioAtendidoUseCase = marcarEnvioAtendidoUseCase;
    this.cerrarEnvioUseCase = cerrarEnvioUseCase;
  }

  async getAll(filters = {}) {
    return await this.getAllAlertasUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getAlertaUseCase.execute(id);
  }

  async getActivas() {
    return await this.getAlertasActivasUseCase.execute();
  }

  async marcarRecibido(id_alerta, id_institucion) {
    return await this.marcarEnvioRecibidoUseCase.execute(
      id_alerta,
      id_institucion
    );
  }

  async marcarAtendido(id_alerta, id_institucion) {
    return await this.marcarEnvioAtendidoUseCase.execute(
      id_alerta,
      id_institucion
    );
  }

  async cerrar(id_alerta, id_institucion) {
    return await this.cerrarEnvioUseCase.execute(
      id_alerta,
      id_institucion
    );
  }
}