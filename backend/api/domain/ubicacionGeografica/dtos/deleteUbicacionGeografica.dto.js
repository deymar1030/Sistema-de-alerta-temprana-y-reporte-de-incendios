export class DeleteUbicacionGeograficaDTO {
  constructor({ id_ubic_geo }) {
    this.id_ubic_geo = id_ubic_geo;
  }

  validate() {
    if (!this.id_ubic_geo || isNaN(Number(this.id_ubic_geo))) {
      throw new Error("id_ubic_geo inválido");
    }
  }
}