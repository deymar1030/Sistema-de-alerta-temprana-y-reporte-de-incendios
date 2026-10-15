import { Validators } from "../../../config/validators.js";
import { LecturaEntity } from "../../../domain/lectura/entities/lectura.entity.js";

function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor);
}

export default class RegistrarLecturaUseCase {
  constructor({ sensorRepository, lecturaRepository, transactionManager, realtimeNotifier }) {
    this.sensorRepository = sensorRepository;
    this.lecturaRepository = lecturaRepository;
    this.transactionManager = transactionManager;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute({ id_predio, id_sensor, valor, fecha_hora }) {
    if (!Validators.isValidId(id_sensor)) throw new Error("id_sensor no válido");
    if (!Validators.isValidId(id_predio)) throw new Error("id_predio no válido");

    if (typeof valor !== "number" || !Number.isFinite(valor)) {
      throw new Error("valor no válido: debe ser un número finito");
    }

    const fecha = aFecha(fecha_hora);
    if (Number.isNaN(fecha.getTime())) throw new Error("fecha_hora no válida");

    const idSensor = Number(id_sensor);
    const idPredio = Number(id_predio);

    const sensor = await this.sensorRepository.findById(idSensor);
    if (!sensor) throw new Error(`Sensor ${idSensor} no encontrado`);

    const desestimada = this._motivoDesestimacion(sensor, idPredio);
    if (desestimada) {
      console.warn(`[registrarLectura] lectura descartada (id_sensor ${idSensor}): ${desestimada}`);
      return { resultado: "DESCARTADA", motivo: desestimada, sensor };
    }

    const motivo = await this._motivoInvalidez(sensor, idSensor, valor, fecha);

    if (motivo) {
      const datos = {
        id_sensor: idSensor,
        id_alerta: null,
        valor,
        fecha_hora: fecha,
        estado_lectura: "INVALIDA",
        tipo_variable: sensor.tipo_sensor,
      };

      const persistida = await this.transactionManager.runInTransaction((tx) =>
        this.lecturaRepository.create(datos, tx)
      );

      await this.realtimeNotifier.emitLecturaNueva({ ...persistida, id_predio: idPredio });

      return { resultado: "INVALIDA", motivo, lectura: persistida, sensor };
    }

    const lectura = new LecturaEntity({
      id_lectura: null,
      id_sensor: idSensor,
      id_alerta: null,
      valor,
      fecha_hora: fecha,
      estado_lectura: null,
      tipo_variable: sensor.tipo_sensor,
    });

    return { resultado: "VALIDA", lectura, sensor };
  }

  _motivoDesestimacion(sensor, idPredio) {
    if (Number(sensor.id_predio) !== idPredio) {
      return `sensor ${sensor.id_sensor} no pertenece al predio del tópico (${idPredio}); pertenece al predio ${sensor.id_predio}`;
    }

    if (sensor.estado !== "ACTIVO") {
      return `sensor ${sensor.id_sensor} no está activo (estado "${sensor.estado}")`;
    }

    return null;
  }

  async _motivoInvalidez(sensor, idSensor, valor, fecha) {
    const rangoMin = Number(sensor.rango_min);
    const rangoMax = Number(sensor.rango_max);
    if (valor < rangoMin || valor > rangoMax) return "fuera de rango";

    // "No futura": se compara contra el reloj del servidor.
    const ahora = new Date();
    if (fecha.getTime() > ahora.getTime()) return "fecha futura";

    const ultima = await this.sensorRepository.findUltimaLectura(idSensor);
    if (ultima && fecha.getTime() <= aFecha(ultima.fecha_hora).getTime()) {
      return "fecha no posterior a la última lectura";
    }

    return null;
  }
}
