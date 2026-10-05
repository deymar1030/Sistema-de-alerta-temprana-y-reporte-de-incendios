export class SensorEntity {
  constructor({ id_sensor, fecha_instalacion, estado, tipo_sensor, unidad_medida, nombre, modelo, fabricante }) {
    this.id_sensor = id_sensor;
    this.fecha_instalacion = fecha_instalacion;
    this.estado = estado;
    this.tipo_sensor = tipo_sensor;
    this.unidad_medida = unidad_medida;
    this.nombre = nombre;
    this.modelo = modelo;
    this.fabricante = fabricante;
  }
}