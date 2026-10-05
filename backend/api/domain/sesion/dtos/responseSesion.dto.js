// Nunca expone token_hash: solo lo necesario para que el usuario vea sus sesiones.
export class ResponseSesionDTO {
  constructor({ id_sesion, dispositivo, ip_origen, creada_en, ultima_actividad, expira_en, actual }) {
    this.id_sesion = id_sesion;
    this.dispositivo = dispositivo;
    this.ip_origen = ip_origen;
    this.creada_en = creada_en;
    this.ultima_actividad = ultima_actividad;
    this.expira_en = expira_en;
    this.actual = actual;
  }

  static fromEntity(sesion, idSesionActual) {
    return new ResponseSesionDTO({
      id_sesion: sesion.id_sesion,
      dispositivo: sesion.dispositivo,
      ip_origen: sesion.ip_origen,
      creada_en: sesion.creada_en,
      ultima_actividad: sesion.ultima_actividad,
      expira_en: sesion.expira_en,
      actual: sesion.id_sesion === idSesionActual,
    });
  }
}
