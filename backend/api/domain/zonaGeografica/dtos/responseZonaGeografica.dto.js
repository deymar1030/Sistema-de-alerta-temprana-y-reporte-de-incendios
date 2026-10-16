export class ResponseZonaGeograficaDTO {
  constructor({
    id_zona,
    nombre,
    departamento,
    municipio,
    descripcion,
    estado,
    densidad_poblacional,
  }) {
    this.id_zona = id_zona;
    this.nombre = nombre;
    this.departamento = departamento;
    this.municipio = municipio;
    this.descripcion = descripcion;
    this.estado = estado;
    this.densidad_poblacional = densidad_poblacional;
  }

  static fromEntity(zonaGeografica) {
    return new ResponseZonaGeograficaDTO({
      id_zona: zonaGeografica.id_zona,
      nombre: zonaGeografica.nombre,
      departamento: zonaGeografica.departamento,
      municipio: zonaGeografica.municipio,
      descripcion: zonaGeografica.descripcion,
      estado: zonaGeografica.estado,
      densidad_poblacional: zonaGeografica.densidad_poblacional,
    });
  }
}
