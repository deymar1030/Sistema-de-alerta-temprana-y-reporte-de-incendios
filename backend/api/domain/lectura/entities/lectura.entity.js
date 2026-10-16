export class LecturaEntity {
  constructor({ id_lectura, id_sensor, id_alerta, valor, fecha_hora, estado_lectura, tipo_variable }) {
    this.id_lectura = id_lectura;
    this.id_sensor = id_sensor;
    this.id_alerta = id_alerta;
    this.valor = valor;
    this.fecha_hora = fecha_hora;
    this.estado_lectura = estado_lectura;
    this.tipo_variable = tipo_variable;
  }
}
