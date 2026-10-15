import {
  filtroHampel,
  cusum,
  theilSen,
  contrasteVecinos,
  puntajeAlerta,
  clasificarAlerta,
  obtenerConfiguracionMotor,
  CONSTANTES_FORMULA,
} from "../../../domain/motorDeteccion/index.js";

const MINUTO_MS = 60000;

const CONSTANTES_APLICACION = {
  contextoPrevioMin: 5,
  antiguedadVecinaMin: 2,
  etapa2DatosMin: 2,
  esperaDescarteMin: 15,
};

function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor);
}

function minutos(min) {
  return min * MINUTO_MS;
}

function normalizarVariable(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function fechaDeAlerta(alerta) {
  const dia = aFecha(alerta.fecha);
  const hora = aFecha(alerta.hora);

  return new Date(
    Date.UTC(
      dia.getUTCFullYear(),
      dia.getUTCMonth(),
      dia.getUTCDate(),
      hora.getUTCHours(),
      hora.getUTCMinutes(),
      hora.getUTCSeconds(),
      hora.getUTCMilliseconds(),
    ),
  );
}

function fechaSoloDia(instante) {
  return new Date(Date.UTC(instante.getUTCFullYear(), instante.getUTCMonth(), instante.getUTCDate()));
}

function horaDelInstante(instante) {
  return new Date(
    Date.UTC(1970, 0, 1, instante.getUTCHours(), instante.getUTCMinutes(), instante.getUTCSeconds(), instante.getUTCMilliseconds()),
  );
}

export default class EvaluarLecturaUseCase {
  constructor({ lecturaRepository, alertaRepository, predioRepository, transactionManager, realtimeNotifier }) {
    this.lecturaRepository = lecturaRepository;
    this.alertaRepository = alertaRepository;
    this.predioRepository = predioRepository;
    this.transactionManager = transactionManager;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute({ lectura, sensor }) {
    if (!lectura) throw new Error("lectura no proporcionada");
    if (!sensor) throw new Error("sensor no proporcionado");

    const idSensor = Number(lectura.id_sensor);
    const idPredio = Number(sensor.id_predio);
    const fecha = aFecha(lectura.fecha_hora);
    const variableActual = normalizarVariable(sensor.tipo_sensor);

    const predio = await this.predioRepository.findById(idPredio);
    if (!predio) throw new Error(`Predio ${idPredio} no encontrado`);

    let config;
    try {
      config = obtenerConfiguracionMotor(predio.tipo_predio);
    } catch (error) {
      return await this._noEvaluable({ predio, lectura, motivo: error.message });
    }

    if (!config.variables[variableActual]) {
      const validas = Object.keys(config.variables).join(", ");
      return await this._noEvaluable({
        predio,
        lectura,
        motivo: `variable no soportada: '${sensor.tipo_sensor}'. Variables válidas: ${validas}`,
      });
    }

    const alertaActiva = await this.alertaRepository.findActivaByPredio(idPredio);
    const ultimaDescartada = await this.alertaRepository.findUltimaDescartadaByPredio(idPredio);
    const sensoresPredio = await this.predioRepository.findSensores(idPredio);

    const senialActual = await this._senialSensor({ id_sensor: idSensor, tipo_sensor: sensor.tipo_sensor }, config, fecha, {
      valor: Number(lectura.valor),
      fecha_hora: fecha,
    });

    const estadoLectura = senialActual.esAnomalo ? "ANOMALA" : "VALIDA";

    if (!alertaActiva && !this._puedeAbrir({ ultimaDescartada, senial: senialActual, fecha })) {
      return await this._guardar({
        lectura,
        idPredio,
        fecha,
        estadoLectura,
        idAlerta: null,
        alertaCrear: null,
        alertaActualizar: null,
      });
    }

    if (alertaActiva && alertaActiva.estado !== "EN_EVALUACION") {
      return await this._guardar({
        lectura,
        idPredio,
        fecha,
        estadoLectura,
        idAlerta: Number(alertaActiva.id_alerta),
        alertaCrear: null,
        alertaActualizar: null,
      });
    }

    const senales = await this._senialesPredio({ sensoresPredio, config, fecha, idSensor, senialActual, predio });
    const R = this._puntaje(senales, config);

    // PENDIENTE (decisión de aplicación): se asume que `alerta.fecha` (@db.Date) y
    // `alerta.hora` (@db.Time) se combinan en un instante UTC para medir los 2 min
    // de etapa 2 y el tiempo máximo de evaluación.
    const fechaApertura = alertaActiva ? fechaDeAlerta(alertaActiva) : fecha;
    const hayContexto = fecha.getTime() - fechaApertura.getTime() >= minutos(CONSTANTES_APLICACION.etapa2DatosMin);

    if (!hayContexto) {
      // Antes de los 2 minutos desde la apertura solo se evalúa la condición de
      // confirmación inmediata; no se ejecuta el clasificador completo.
      const { confirmacionInmediata } = this._condicionesConfirmacion({ senialActual, senales, variableActual });

      if (!alertaActiva) {
        const estado = confirmacionInmediata ? "CONFIRMADA" : "EN_EVALUACION";

        return await this._guardar({
          lectura,
          idPredio,
          fecha,
          estadoLectura,
          idAlerta: null,
          alertaCrear: {
            fecha: fechaSoloDia(fecha),
            hora: horaDelInstante(fecha),
            estado,
            clasificacion: confirmacionInmediata ? "INCENDIO" : null,
            fecha_confirmacion: estado === "CONFIRMADA" ? fecha : null,
            fecha_cierre: null,
          },
          alertaActualizar: null,
        });
      }

      // Con una alerta ya activa, antes de los 2 minutos se asocia y persiste la lectura;
      // la alerta solo se actualiza si se cumple la confirmación inmediata.
      return await this._guardar({
        lectura,
        idPredio,
        fecha,
        estadoLectura,
        idAlerta: Number(alertaActiva.id_alerta),
        alertaCrear: null,
        alertaActualizar: confirmacionInmediata
          ? {
              id: Number(alertaActiva.id_alerta),
              datos: {
                estado: "CONFIRMADA",
                clasificacion: "INCENDIO",
                fecha_confirmacion: fecha,
              },
            }
          : null,
      });
    }

    const entrada = this._entrada({
      senales,
      senialActual,
      config,
      R,
      fechaApertura,
      fecha,
      variableActual,
    });

    const { estado, clasificacion } = clasificarAlerta(entrada);

    const datos = { estado, clasificacion };
    if (estado === "CONFIRMADA" && !alertaActiva.fecha_confirmacion) datos.fecha_confirmacion = fecha;
    if (estado === "DESCARTADA" && !alertaActiva.fecha_cierre) datos.fecha_cierre = fecha;

    return await this._guardar({
      lectura,
      idPredio,
      fecha,
      estadoLectura,
      idAlerta: Number(alertaActiva.id_alerta),
      alertaCrear: null,
      alertaActualizar: { id: Number(alertaActiva.id_alerta), datos },
    });
  }

  _puedeAbrir({ ultimaDescartada, senial, fecha }) {
    const cierre = ultimaDescartada?.fecha_cierre ? aFecha(ultimaDescartada.fecha_cierre) : null;
    const enEspera = cierre !== null && fecha.getTime() - cierre.getTime() < minutos(CONSTANTES_APLICACION.esperaDescarteMin);

    return senial.esCritico || (senial.esAnomalo && !enEspera);
  }

  _condicionesConfirmacion({ senialActual, senales, variableActual }) {
    const otroSensorCritico = senales.some((s) => s.id_sensor !== senialActual.id_sensor && s.esCritico);
    const respaldoCritico = senialActual.lecturaAnterior?.esCritico === true || otroSensorCritico;
    const otraVariableAnomala = senales.some((s) => s.variable !== variableActual && s.esAnomalo);
    const valorCriticoActual = senialActual.esCritico;

    return {
      valorCriticoActual,
      respaldoCritico,
      otraVariableAnomala,
      confirmacionInmediata: valorCriticoActual && (respaldoCritico || otraVariableAnomala),
    };
  }

  _entrada({ senales, senialActual, config, R, fechaApertura, fecha, variableActual }) {
    const humoAnomalo = senales.some((s) => s.variable === "humo" && s.esAnomalo);
    const coAnomalo = senales.some((s) => s.variable === "co" && s.esAnomalo);
    const algunSensorCusumDisparado = senales.some((s) => s.cusumDisparado);
    const anomales = senales.filter((s) => s.esAnomalo);
    const { valorCriticoActual, respaldoCritico, otraVariableAnomala } = this._condicionesConfirmacion({
      senialActual,
      senales,
      variableActual,
    });

    const zrobDeTodos = senales.map((s) => s.zrob);
    const todosZrobBajoUmbral =
      zrobDeTodos.length > 0 &&
      zrobDeTodos.every((z) => z !== null && Number.isFinite(z) && Math.abs(z) <= CONSTANTES_FORMULA.zrobUmbral);

    return {
      R,
      umbralConfirmacion: config.umbralConfirmacion,
      umbralDescarte: config.umbralDescarte,
      algunSensorCusumDisparado,
      humoAnomalo,
      coAnomalo,
      unicoSensorAnomalo: anomales.length === 1,
      // PENDIENTE (criterio no definido en el PDF): "salto físicamente imposible".
      // No se asume ningún valor → la regla 1 (FALLA_SENSOR) queda deshabilitada.
      saltoFisicoImposible: false,
      // PENDIENTE (criterio no definido en el PDF): "sin cambios en las demás variables".
      // No se asume ningún valor → la regla 1 (FALLA_SENSOR) queda deshabilitada.
      otrasVariablesSinCambios: false,
      valorCriticoActual,
      respaldoCritico,
      otraVariableAnomala,
      // PENDIENTE (criterio no definido en el PDF): "mayoría de vecinos afectados".
      // No se asume ningún valor → la regla 4 (CLIMA) queda deshabilitada.
      mayoriaVecinosAfectados: false,
      todosZrobBajoUmbral,
      tiempoEvaluacionVencido: fecha.getTime() - fechaApertura.getTime() >= minutos(config.tiempoMaxEvaluacionMin),
    };
  }

  _puntaje(senales, config) {
    const porVariable = {};

    for (const senial of senales) {
      if (!porVariable[senial.variable]) porVariable[senial.variable] = [];
      porVariable[senial.variable].push({ z: senial.z, b: senial.b, zrob: senial.zrob });
    }

    return puntajeAlerta(porVariable, config.variables).R;
  }

  async _senialesPredio({ sensoresPredio, config, fecha, idSensor, senialActual, predio }) {
    const senales = [senialActual];

    for (const sensor of sensoresPredio) {
      if (Number(sensor.id_sensor) === idSensor) continue;
      const senial = await this._senialSensor(sensor, config, fecha, null);
      if (senial) senales.push(senial);
    }

    await this._aplicarContraste(senales, predio, config, fecha);

    return senales;
  }

  async _senialSensor({ id_sensor, tipo_sensor }, config, fechaLimite, lecturaForzada) {
    const variable = normalizarVariable(tipo_sensor);
    const parametro = config.variables[variable];
    if (!parametro) return null;

    const recientes = await this.lecturaRepository.findLecturasRecientes(id_sensor, {
      desde: new Date(fechaLimite.getTime() - minutos(CONSTANTES_APLICACION.etapa2DatosMin)),
      hasta: fechaLimite,
    });

    let lectura;
    if (lecturaForzada) {
      lectura = { valor: Number(lecturaForzada.valor), fecha_hora: aFecha(lecturaForzada.fecha_hora) };
    } else {
      const ultima = recientes.at(-1);
      if (!ultima) return null;
      lectura = { valor: Number(ultima.valor), fecha_hora: aFecha(ultima.fecha_hora) };
    }

    const referencia = lectura.fecha_hora;
    const valorMotor = this._valorMotor(variable, lectura.valor);

    const ultimas = await this.lecturaRepository.findUltimasLecturas(id_sensor, {
      limite: CONSTANTES_FORMULA.cusumVentanaLecturas,
    });

    const anteriores = ultimas.filter((fila) => aFecha(fila.fecha_hora).getTime() < referencia.getTime());

    const lecturaAnteriorCruda = anteriores.at(-1) ?? null;
    const lecturaAnterior = lecturaAnteriorCruda
      ? {
          valor: Number(lecturaAnteriorCruda.valor),
          esCritico:
            parametro.umbralCritico !== null &&
            parametro.umbralCritico !== undefined &&
            Number(lecturaAnteriorCruda.valor) >= Number(parametro.umbralCritico),
        }
      : null;

    const serie = [
      ...anteriores.map((fila) => ({
        valor: this._valorMotor(variable, Number(fila.valor)),
        fecha_hora: aFecha(fila.fecha_hora),
      })),
      { valor: valorMotor, fecha_hora: referencia },
    ].slice(-CONSTANTES_FORMULA.cusumVentanaLecturas);

    // CUSUM: cada lectura de la serie se normaliza con su propia ventana Hampel,
    // formada únicamente por el historial válido anterior a esa lectura (sin lecturas
    // futuras ni reutilizar la ventana del instante actual).
    const historial = await this.lecturaRepository.findHistorialBySensor(id_sensor, {
      desde: new Date(serie[0].fecha_hora.getTime() - minutos(config.ventanaBaseMin)),
      hasta: referencia,
    });

    const historialValido = historial.map((fila) => ({
      valor: this._valorMotor(variable, Number(fila.valor)),
      fecha_hora: aFecha(fila.fecha_hora),
    }));

    const hampelPorLectura = serie.map((punto) => {
      const inicio = punto.fecha_hora.getTime() - minutos(config.ventanaBaseMin);
      const ventana = historialValido
        .filter(
          (fila) =>
            fila.fecha_hora.getTime() >= inicio && fila.fecha_hora.getTime() < punto.fecha_hora.getTime(),
        )
        .map((fila) => fila.valor);

      return filtroHampel(ventana, punto.valor, parametro.madMin, config.umbralZ);
    });

    const hampel = hampelPorLectura.at(-1);

    const serieZ = hampelPorLectura
      .map((resultado) => resultado.z)
      .filter((z) => z !== null && Number.isFinite(z));

    const { disparado } = cusum(serieZ, config.cusumH, CONSTANTES_FORMULA.cusumK, CONSTANTES_FORMULA.cusumVentanaLecturas);

    // Ventana de Theil–Sen: lecturas del sensor en los `etapa2DatosMin` previos,
    // incluida la actual.
    const serieTiempo = lecturaForzada
      ? [
          ...recientes.map((fila) => ({
            valor: this._valorMotor(variable, Number(fila.valor)),
            fecha_hora: aFecha(fila.fecha_hora),
          })),
          { valor: valorMotor, fecha_hora: referencia },
        ]
      : recientes.map((fila) => ({
          valor: this._valorMotor(variable, Number(fila.valor)),
          fecha_hora: aFecha(fila.fecha_hora),
        }));

    const { pendiente } = theilSen(serieTiempo);

    const esCritico =
      parametro.umbralCritico !== null &&
      parametro.umbralCritico !== undefined &&
      lectura.valor >= Number(parametro.umbralCritico);

    return {
      id_sensor: Number(id_sensor),
      variable,
      valor: lectura.valor,
      valorMotor,
      z: hampel.z,
      b: pendiente,
      zrob: null,
      cusumDisparado: disparado,
      esCritico,
      esAnomalo: hampel.esAnomala || disparado || esCritico,
      lecturaAnterior,
    };
  }

  async _aplicarContraste(senales, predio, config, fecha) {
    const vecinos = await this._vecinos(predio, config);
    const porVariable = new Map();

    for (const senial of senales) {
      if (!porVariable.has(senial.variable)) porVariable.set(senial.variable, []);
      porVariable.get(senial.variable).push(senial);
    }

    for (const [variable, grupo] of porVariable) {
      const parametro = config.variables[variable];
      const ajenos = [];

      for (const vecino of vecinos) {
        for (const sensor of vecino.sensores) {
          if (normalizarVariable(sensor.tipo_sensor) !== variable) continue;
          const valor = await this._ultimaLecturaReciente(sensor.id_sensor, fecha);
          if (valor !== null) ajenos.push(this._valorMotor(variable, valor));
        }
      }

      for (const senial of grupo) {
        const otrosPropios = grupo.filter((otro) => otro !== senial).map((otro) => otro.valorMotor);
        const { zrob } = contrasteVecinos(senial.valorMotor, [...otrosPropios, ...ajenos], parametro.madMin);
        senial.zrob = zrob;
      }
    }
  }

  async _vecinos(predio, config) {
    const candidatos = await this.predioRepository.findVecinos({
      id_predio: predio.id_predio,
      tipo_predio: predio.tipo_predio,
      latitud: predio.latitud,
      longitud: predio.longitud,
      radio_metros: config.radioVecindadM,
    });

    const vecinos = [];

    for (const candidato of candidatos) {
      const activa = await this.alertaRepository.findActivaByPredio(candidato.id_predio);
      if (activa) continue;

      vecinos.push({
        id_predio: candidato.id_predio,
        sensores: await this.predioRepository.findSensores(candidato.id_predio),
      });
    }

    return vecinos;
  }

  async _ultimaLecturaReciente(id_sensor, fecha) {
    const recientes = await this.lecturaRepository.findLecturasRecientes(id_sensor, {
      desde: new Date(fecha.getTime() - minutos(CONSTANTES_APLICACION.antiguedadVecinaMin)),
      hasta: fecha,
    });

    const ultima = recientes.at(-1);
    return ultima ? Number(ultima.valor) : null;
  }

  _valorMotor(variable, valor) {
    return variable === "humedad" ? -Number(valor) : Number(valor);
  }

  async _noEvaluable({ predio, lectura, motivo }) {
    const persistida = await this.transactionManager.runInTransaction((tx) =>
      this.lecturaRepository.create(
        {
          id_sensor: Number(lectura.id_sensor),
          id_alerta: null,
          valor: Number(lectura.valor),
          fecha_hora: aFecha(lectura.fecha_hora),
          estado_lectura: "VALIDA",
          tipo_variable: lectura.tipo_variable,
        },
        tx,
      ),
    );

    // PENDIENTE (decisión acordada, sin implementar): traza en la tabla `auditoria`
    // con evento MOTOR_NO_EVALUADO y motivo/contexto. Hoy no existe capa de acceso a
    // `auditoria`, así que solo se registra en el log del servidor.
    // Esta lectura se emite con `lectura:nueva` después de persistir, según el flujo
    // ya implementado.
    console.warn(`[motorDeteccion] lectura no evaluada (id_sensor ${lectura.id_sensor}): ${motivo}`);

    await this.realtimeNotifier.emitLecturaNueva({ ...persistida, id_predio: Number(predio.id_predio) });

    return { resultado: "NO_EVALUADA", motivo, lectura: persistida, alerta: null };
  }

  async _guardar({ lectura, idPredio, fecha, estadoLectura, idAlerta, alertaCrear, alertaActualizar }) {
    const { persistida, alerta } = await this.transactionManager.runInTransaction(async (tx) => {
      let alertaResultado = null;

      if (alertaCrear) alertaResultado = await this.alertaRepository.create(alertaCrear, tx);
      if (alertaActualizar) alertaResultado = await this.alertaRepository.update(alertaActualizar.id, alertaActualizar.datos, tx);

      const idVinculo = alertaResultado ? alertaResultado.id_alerta : idAlerta;

      const creada = await this.lecturaRepository.create(
        {
          id_sensor: Number(lectura.id_sensor),
          id_alerta: idVinculo === null || idVinculo === undefined ? null : Number(idVinculo),
          valor: Number(lectura.valor),
          fecha_hora: aFecha(lectura.fecha_hora),
          estado_lectura: estadoLectura,
          tipo_variable: lectura.tipo_variable,
        },
        tx,
      );

      if (alertaResultado && alertaCrear) {
        await this.lecturaRepository.vincularLecturasPrevias(
          {
            id_predio: idPredio,
            id_alerta: alertaResultado.id_alerta,
            desde: new Date(fecha.getTime() - minutos(CONSTANTES_APLICACION.contextoPrevioMin)),
            hasta: fecha,
          },
          tx,
        );
      }

      return { persistida: creada, alerta: alertaResultado };
    });

    await this.realtimeNotifier.emitLecturaNueva({ ...persistida, id_predio: idPredio });
    if (alerta?.estado === "CONFIRMADA") await this.realtimeNotifier.emitAlertaConfirmada(alerta);
    if (alerta?.estado === "DESCARTADA") await this.realtimeNotifier.emitAlertaDescartada(alerta);

    return { resultado: estadoLectura, lectura: persistida, alerta };
  }
}
