export default class LecturaRepository {
  async findAll(filters, pagination) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async create(datos, client) {
    throw new Error("Method not implemented");
  }

  async vincularLecturasPrevias(datos, client) {
    throw new Error("Method not implemented");
  }

  async findHistorialBySensor(id_sensor, filtros, client) {
    throw new Error("Method not implemented");
  }

  async findLecturasRecientes(id_sensor, filtros, client) {
    throw new Error("Method not implemented");
  }

  async findUltimasLecturas(id_sensor, filtros, client) {
    throw new Error("Method not implemented");
  }
}
