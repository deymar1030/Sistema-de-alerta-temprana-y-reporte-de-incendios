// Contrato para verificar credenciales. No conoce sesiones ni roles.
export default class AuthRepository {
  async findByCorreo(correo) {
    throw new Error("Method not implemented");
  }

  async incrementarIntentosFallidos(id_usuario) {
    throw new Error("Method not implemented");
  }

  async bloquearHasta(id_usuario, fecha) {
    throw new Error("Method not implemented");
  }

  async limpiarIntentos(id_usuario) {
    throw new Error("Method not implemented");
  }
}
