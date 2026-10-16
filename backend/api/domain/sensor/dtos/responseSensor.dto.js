function toNumber(v) {
  return v === null || v === undefined ? null : Number(v);
}

export class ResponseSensorDTO {
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
    ultima_lectura = undefined,
    predio = undefined,
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
    if (ultima_lectura !== undefined) this.ultima_lectura = ultima_lectura;
    if (predio !== undefined) this.predio = predio;
  }

  static fromEntity(sensor, ultima_lectura = undefined, predio = undefined) {
    return new ResponseSensorDTO({
      id_sensor: sensor.id_sensor,
      id_predio: sensor.id_predio,
      nombre: sensor.nombre,
      tipo_sensor: sensor.tipo_sensor,
      unidad_medida: sensor.unidad_medida,
      modelo: sensor.modelo,
      fabricante: sensor.fabricante,
      fecha_instalacion: sensor.fecha_instalacion,
      estado: sensor.estado,
      rango_min: toNumber(sensor.rango_min),
      rango_max: toNumber(sensor.rango_max),
      ultima_lectura,
      predio,
    });
  }
}
