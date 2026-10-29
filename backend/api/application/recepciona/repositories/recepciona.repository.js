export default class RecepcionaRepository {
  // Asignaciones ASIGNADO vigentes (alerta no CERRADA/DESCARTADA) de estos
  // usuarios, incluyendo la alerta a la que estan comprometidos.
  async findAsignacionesActivas(idsUsuarios) {
    throw new Error("Method not implemented");
  }

  // Crea/reactiva (upsert) la asignacion ASIGNADO de cada usuario a la alerta.
  async asignar(id_alerta, idsUsuarios) {
    throw new Error("Method not implemented");
  }

  // Asignaciones ASIGNADO vigentes de este usuario, con la alerta completa
  // (para que el OPERATIVO vea a que alertas lo asignaron y donde quedan).
  async findAsignacionesActivasConAlerta(id_usuario) {
    throw new Error("Method not implemented");
  }
}
