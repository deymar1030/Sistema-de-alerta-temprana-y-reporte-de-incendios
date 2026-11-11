export default class InformeAtencionRepository {
  async create(informeData) {
    throw new Error("Method not implemented");
  }

  // Crea el informe y, si nace en COMPLETADO, cierra la alerta (atomico).
  async crearYEvaluarCierre(informeData) {
    throw new Error("Method not implemented");
  }

  async findAll(filters) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async update(id, informeData) {
    throw new Error("Method not implemented");
  }

  // Actualiza el informe y, solo en la transicion a COMPLETADO, cierra la
  // alerta y libera a los OPERATIVO asignados (atomico).
  async actualizarYEvaluarCierre(id, informeData, { id_alerta, yaCompletado }) {
    throw new Error("Method not implemented");
  }
}
