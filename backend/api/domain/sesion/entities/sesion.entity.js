export class SesionEntity {
  constructor({ id_sesion, id_usuario, token_hash, expira_en }) {
    this.id_sesion = id_sesion;
    this.id_usuario = id_usuario;
    this.token_hash = token_hash;
    this.expira_en = expira_en;
  }
}
