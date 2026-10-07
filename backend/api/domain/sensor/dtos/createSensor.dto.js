const TIPOS_SENSOR = ["TEMPERATURA", "HUMO", "CO", "HUMEDAD"];

export class CreateSensorDTO {
  constructor({
    id_predio,
    nombre,
    tipo_sensor,
    unidad_medida = null,
    modelo = null,
    fabricante = null,
    fecha_instalacion = null,
    estado = "ACTIVO",
    rango_min,
    rango_max,
  }) {
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

  static validate({ id_predio, nombre, tipo_sensor, rango_min, rango_max }) {
    const errors = [];

    if (!id_predio) errors.push("Missing id_predio");
    if (!nombre) errors.push("Missing nombre");
    if (!tipo_sensor) errors.push("Missing tipo_sensor");
    else if (!TIPOS_SENSOR.includes(tipo_sensor)) errors.push(`tipo_sensor must be one of: ${TIPOS_SENSOR.join(", ")}`);
    if (rango_min === undefined || rango_min === null) errors.push("Missing rango_min");
    if (rango_max === undefined || rango_max === null) errors.push("Missing rango_max");
    if (rango_min != null && rango_max != null && Number(rango_min) >= Number(rango_max)) {
      errors.push("rango_min must be less than rango_max");
    }

    return errors;
  }
}
