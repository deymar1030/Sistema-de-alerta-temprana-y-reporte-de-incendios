export class SesionEntity {
  constructor({
    id_sesion,
    id_usuario,
    token_hash,
    dispositivo,
    ip_origen,
    creada_en,
    ultima_actividad,
    expira_en,
    revocada_en,
  }) {
    this.id_sesion = id_sesion;
    this.id_usuario = id_usuario;
    this.token_hash = token_hash;
    this.dispositivo = dispositivo;
    this.ip_origen = ip_origen;
    this.creada_en = creada_en;
    this.ultima_actividad = ultima_actividad;
    this.expira_en = expira_en;
    this.revocada_en = revocada_en;
  }
}
