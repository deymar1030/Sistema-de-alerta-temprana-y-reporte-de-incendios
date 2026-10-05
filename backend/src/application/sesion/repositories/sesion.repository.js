// Contrato para guardar y consultar sesiones del lado del servidor.
export default class SesionRepository {
  async create(sesionData) {
    throw new Error("Method not implemented");
  }

  // Devuelve la sesion junto con los datos publicos del usuario (sin contrasena).
  async findByTokenHash(tokenHash) {
    throw new Error("Method not implemented");
  }

  async findById(id_sesion) {
    throw new Error("Method not implemented");
  }

  async findActivasByUsuario(id_usuario, { ahora, limiteInactividad }) {
    throw new Error("Method not implemented");
  }

  async touch(id_sesion, fecha) {
    throw new Error("Method not implemented");
  }

  async revoke(id_sesion, fecha) {
    throw new Error("Method not implemented");
  }

  async purgeAntiguas(id_usuario, limite) {
    throw new Error("Method not implemented");
  }
}
