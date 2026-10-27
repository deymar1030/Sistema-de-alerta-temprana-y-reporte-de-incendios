export default class NotificacionRepository {
  async create(notificacionData) {
    throw new Error("Method not implemented");
  }

  async createMany(notificacionesData) {
    throw new Error("Method not implemented");
  }

  async findAllByUsuario(id_usuario, filters) {
    throw new Error("Method not implemented");
  }

  async findByIdForUsuario(id, id_usuario) {
    throw new Error("Method not implemented");
  }

  async countNoLeidas(id_usuario) {
    throw new Error("Method not implemented");
  }

  async marcarLeida(id) {
    throw new Error("Method not implemented");
  }

  async marcarTodasLeidas(id_usuario) {
    throw new Error("Method not implemented");
  }
}
