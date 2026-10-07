export default class AlertaRepository {
  async findAll(filters = {}) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async findActive() {
    throw new Error("Method not implemented");
  }

  async findEnvio(id_alerta, id_institucion) {
    throw new Error("Method not implemented");
  }

  async updateEnvioEstado(id_alerta, id_institucion, estado) {
    throw new Error("Method not implemented");
  }
}