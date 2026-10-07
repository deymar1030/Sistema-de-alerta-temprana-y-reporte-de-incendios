export default class SesionRepository {
  async create(sesionData) {
    throw new Error("Method not implemented");
  }

  async findByTokenHash(tokenHash) {
    throw new Error("Method not implemented");
  }

  async findById(id_sesion) {
    throw new Error("Method not implemented");
  }

  async findActivasByUsuario(id_usuario, ahora) {
    throw new Error("Method not implemented");
  }

  async revoke(id_sesion) {
    throw new Error("Method not implemented");
  }

  async purgeAntiguas(id_usuario, limite) {
    throw new Error("Method not implemented");
  }
}
