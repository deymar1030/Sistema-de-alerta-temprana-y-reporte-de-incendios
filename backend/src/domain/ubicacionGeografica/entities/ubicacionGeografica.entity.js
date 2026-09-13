export class UbicacionGeograficaEntity {
  constructor({
    id_ubic_geo,
    id_zona,
    id_motordet,
    latitud,
    longitud,
    altitud,
    poligono_geografico,
  }) {
    this.id_ubic_geo = id_ubic_geo;
    this.id_zona = id_zona;
    this.id_motordet = id_motordet;
    this.latitud = latitud;
    this.longitud = longitud;
    this.altitud = altitud;
    this.poligono_geografico = poligono_geografico;
  }
}