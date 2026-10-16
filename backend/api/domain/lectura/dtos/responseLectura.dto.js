export class ResponseLecturaDTO {
  constructor({ id_lectura, id_sensor, id_alerta, valor, fecha_hora, estado_lectura, tipo_variable }) {
    this.id_lectura = id_lectura;
    this.id_sensor = id_sensor;
    this.id_alerta = id_alerta;
    this.valor = valor;
    this.fecha_hora = fecha_hora;
    this.estado_lectura = estado_lectura;
    this.tipo_variable = tipo_variable;
  }

  static fromEntity(lectura) {
    return new ResponseLecturaDTO({
      id_lectura: lectura.id_lectura,
      id_sensor: lectura.id_sensor,
      id_alerta: lectura.id_alerta,
      valor: Number(lectura.valor),
      fecha_hora: lectura.fecha_hora,
      estado_lectura: lectura.estado_lectura,
      tipo_variable: lectura.tipo_variable,
    });
  }
}
