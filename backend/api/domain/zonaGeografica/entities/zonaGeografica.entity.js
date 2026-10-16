export class ZonaGeograficaEntity {
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
}
