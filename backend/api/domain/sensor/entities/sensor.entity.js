export class SensorEntity {
  constructor({
    id_sensor,
    id_predio,
    nombre,
    tipo_sensor,
    unidad_medida,
    modelo,
    fabricante,
    fecha_instalacion,
    estado,
    rango_min,
    rango_max,
  }) {
    this.id_sensor = id_sensor;
    this.id_predio = id_predio;
    this.nombre = nombre;
    this.tipo_sensor = tipo_sensor;
    this.unidad_medida = unidad_medida;
    this.modelo = modelo;
    this.fabricante = fabricante;
    this.fecha_instalacion = fecha_instalacion;
    this.estado = estado;
    this.rango_min = rango_min;
    this.rango_max = rango_max;
  }
}
