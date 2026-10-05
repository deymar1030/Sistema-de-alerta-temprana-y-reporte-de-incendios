export class ReporteUService {
  constructor({
    createReporteUUseCase,
    getAllReporteUUseCase,
    getReporteUUseCase,
    updateEstadoReporteUUseCase,
    vincularAlertaReporteUUseCase,
  }) {
    this.createReporteUUseCase = createReporteUUseCase;
    this.getAllReporteUUseCase = getAllReporteUUseCase;
    this.getReporteUUseCase = getReporteUUseCase;
    this.updateEstadoReporteUUseCase = updateEstadoReporteUUseCase;
    this.vincularAlertaReporteUUseCase = vincularAlertaReporteUUseCase;
  }

  async create(reporteUData) {
    return await this.createReporteUUseCase.execute(reporteUData);
  }

  async getAll(filters) {
    return await this.getAllReporteUUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getReporteUUseCase.execute(id);
  }

  async updateEstado(id, data) {
    return await this.updateEstadoReporteUUseCase.execute(id, data);
  }

  async vincularAlerta(id, data) {
    return await this.vincularAlertaReporteUUseCase.execute(id, data);
  }
}
