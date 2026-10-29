// Solo lectura a proposito: `auditoria`/`auditoriau` las escriben triggers de
// BD a cargo de seguridad, no el backend. No agregar create/update/delete aca.
export default class AuditoriaRepository {
  async findAll(filters) {
    throw new Error("Method not implemented");
  }

  async findAllUsuario(filters) {
    throw new Error("Method not implemented");
  }
}
