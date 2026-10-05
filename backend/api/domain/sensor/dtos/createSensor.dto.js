export class CreateSensorDTO {
  constructor({ fecha_instalacion, estado, tipo_sensor, unidad_medida, nombre, modelo, fabricante, id_ubic_geo }) {
    this.fecha_instalacion = fecha_instalacion;
    this.estado = estado;
    this.tipo_sensor = tipo_sensor;
    this.unidad_medida = unidad_medida;
    this.nombre = nombre;
    this.modelo = modelo;
    this.fabricante = fabricante;
    this.id_ubic_geo = id_ubic_geo;
  }

  static validate(data) {
    const { fecha_instalacion, estado, tipo_sensor, unidad_medida, nombre, modelo, fabricante, id_ubic_geo } = data;

    if (!fecha_instalacion || !estado || !tipo_sensor || !unidad_medida || !nombre || !modelo || !fabricante || !id_ubic_geo) {
      throw new Error("Todos los campos del sensor son obligatorios");
    }

    return new CreateSensorDTO(data);
  }
}