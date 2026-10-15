export default class AlertaRepository {
  async findAll(filters) {
    throw new Error("Method not implemented");
  }

  async findActivas(filters) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async findLecturasByAlerta(id_alerta) {
    throw new Error("Method not implemented");
  }

  async findPredioByAlerta(id_alerta) {
    throw new Error("Method not implemented");
  }

  async findInstitucionesNotificadas(id_alerta) {
    throw new Error("Method not implemented");
  }

  async findReporteOrigen(id_alerta) {
    throw new Error("Method not implemented");
  }

  async findActivaByPredio(id_predio, client) {
    throw new Error("Method not implemented");
  }

  async findUltimaDescartadaByPredio(id_predio, client) {
    throw new Error("Method not implemented");
  }

  async create(datos, client) {
    throw new Error("Method not implemented");
  }

  async update(id_alerta, datos, client) {
    throw new Error("Method not implemented");
  }
}
