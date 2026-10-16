export class ResponseSesionDTO {
  constructor({ id_sesion, expira_en, actual }) {
    this.id_sesion = id_sesion;
    this.expira_en = expira_en;
    this.actual = actual;
  }

  static fromEntity(sesion, idSesionActual) {
    return new ResponseSesionDTO({
      id_sesion: sesion.id_sesion,
      expira_en: sesion.expira_en,
      actual: sesion.id_sesion === idSesionActual,
    });
  }
}
