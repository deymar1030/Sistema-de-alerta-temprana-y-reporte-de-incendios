export class UpdateUbicacionGeograficaDTO {
  constructor({
    id_zona,
    id_motordet,
    latitud,
    longitud,
    altitud,
    poligono_geografico,
  }) {
    this.id_zona = id_zona;
    this.id_motordet = id_motordet;
    this.latitud = latitud;
    this.longitud = longitud;
    this.altitud = altitud;
    this.poligono_geografico = poligono_geografico;
  }

  validate() {
    const errors = [];

    if (this.latitud !== undefined && (this.latitud < -90 || this.latitud > 90)) {
      errors.push("latitud debe estar entre -90 y 90");
    }
    if (this.longitud !== undefined && (this.longitud < -180 || this.longitud > 180)) {
      errors.push("longitud debe estar entre -180 y 180");
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "));
    }
  }
}