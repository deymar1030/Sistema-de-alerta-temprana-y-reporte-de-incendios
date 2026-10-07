export class AlertaService {
  constructor({
    getAllAlertaUseCase,
    getActivasAlertaUseCase,
    getAlertaUseCase,
    recibirEnvioUseCase,
    atenderEnvioUseCase,
    cerrarEnvioUseCase,
  }) {
    this.getAllAlertaUseCase = getAllAlertaUseCase;
    this.getActivasAlertaUseCase = getActivasAlertaUseCase;
    this.getAlertaUseCase = getAlertaUseCase;
    this.recibirEnvioUseCase = recibirEnvioUseCase;
    this.atenderEnvioUseCase = atenderEnvioUseCase;
    this.cerrarEnvioUseCase = cerrarEnvioUseCase;
  }

  async getAll(filters) {
    return await this.getAllAlertaUseCase.execute(filters);
  }

  async getActivas(filters) {
    return await this.getActivasAlertaUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getAlertaUseCase.execute(id);
  }

  async recibir(id_alerta, id_institucion) {
    return await this.recibirEnvioUseCase.execute(id_alerta, id_institucion);
  }

  async atender(id_alerta, id_institucion) {
    return await this.atenderEnvioUseCase.execute(id_alerta, id_institucion);
  }

  async cerrar(id_alerta, id_institucion) {
    return await this.cerrarEnvioUseCase.execute(id_alerta, id_institucion);
  }
}
