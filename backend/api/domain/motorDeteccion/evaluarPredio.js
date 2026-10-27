import { filtroHampel, cusum, theilSen, contrasteVecinos, puntajeAlerta, clasificarAlerta } from './index.js';
import { normalizarVariable } from '../sensor/tiposSensor.js';

export function inicioAlerta(alerta) {
  return new Date(`${new Date(alerta.fecha).toISOString().slice(0, 10)}T${new Date(alerta.hora).toISOString().slice(11, 23)}Z`);
}

export function distanciaMetros(a, b) {
  const rad = (x) => Number(x) * Math.PI / 180;
  const dlat = rad(b.latitud) - rad(a.latitud), dlon = rad(b.longitud) - rad(a.longitud);
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dlon / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

function senalSensor(sensor, motor, config, ahora) {
  const variable = normalizarVariable(sensor.tipo_sensor);
  const p = config.variables[variable];
  const registros = sensor.lecturas.filter((l) => l.estado_lectura !== 'INVALIDA' && +l.fecha_hora <= +ahora)
    .sort((a, b) => +a.fecha_hora - +b.fecha_hora);
  const actual = registros.at(-1);
  const fresca = actual && +ahora - +actual.fecha_hora <= config.frescuraSegundos * 1000;
  if (!p || !fresca) return { id_sensor: sensor.id_sensor, variable, fresca: false, anomala: false, z: null, b: null, zrob: null };
  const referencia = registros.filter((l) => l.estado_lectura === 'VALIDA' && l.id_alerta == null &&
    +l.fecha_hora < +actual.fecha_hora && +l.fecha_hora >= +ahora - Number(motor.ventana_base_min) * 60000);
  const valores = referencia.length >= config.minLecturasBase ? referencia.map((l) => Number(l.valor) * p.signo) : [];
  const hampel = filtroHampel(valores, Number(actual.valor) * p.signo, p.madMin, Number(motor.umbral_z));
  const recientes = registros.filter((l) => +l.fecha_hora >= +ahora - config.frescuraSegundos * 1000);
  const zs = valores.length ? recientes.slice(-20).map((l) => filtroHampel(valores, Number(l.valor) * p.signo, p.madMin, Number(motor.umbral_z)).z) : [];
  const suma = cusum(zs, Number(motor.cusum_h));
  // Dos minutos de tendencia. Muestreo uniforme acota los pares si el emisor excede la frecuencia pactada.
  const ventana = registros.filter((l) => +l.fecha_hora >= +ahora - config.evaluacionMinutos * 60000);
  const muestra = ventana.length <= 120 ? ventana : Array.from({ length: 120 }, (_, i) => ventana[Math.round(i * (ventana.length - 1) / 119)]);
  const tendencia = theilSen(muestra.map((l) => ({ valor: Number(l.valor) * p.signo, fecha_hora: l.fecha_hora })));
  const previo = registros.at(-2);
  const salto = previo && +actual.fecha_hora > +previo.fecha_hora
    ? Math.abs(Number(actual.valor) - Number(previo.valor)) * 60000 / (+actual.fecha_hora - +previo.fecha_hora) : 0;
  const critico = p.umbralCritico != null && Number(actual.valor) >= p.umbralCritico;
  const respaldo = critico && previo && +ahora - +previo.fecha_hora <= config.frescuraSegundos * 1000 && Number(previo.valor) >= p.umbralCritico;
  return {
    id_sensor: sensor.id_sensor, variable, fresca: true, valor: Number(actual.valor),
    z: hampel.z, b: tendencia.pendiente, zrob: null, cusum: suma.acumulado,
    cusumDisparado: suma.disparado, critico, respaldoCritico: Boolean(respaldo),
    anomala: critico || hampel.esAnomala || suma.disparado,
    saltoFisicoImposible: p.maxSaltoPorMinuto != null && salto > p.maxSaltoPorMinuto,
  };
}

export function evaluarPredio({ sensores, vecinos = [], motor, config, ahora, alerta = null }) {
  const propios = sensores.map((s) => senalSensor(s, motor, config, ahora));
  const externos = vecinos.map((s) => senalSensor(s, motor, config, ahora));
  const todos = [...propios, ...externos];
  for (const senal of todos.filter((s) => s.fresca)) {
    const p = config.variables[senal.variable];
    const grupo = todos.filter((s) => s.fresca && s.variable === senal.variable && String(s.id_sensor) !== String(senal.id_sensor));
    senal.zrob = contrasteVecinos(senal.valor * p.signo, grupo.map((s) => s.valor * p.signo), p.madMin).zrob;
  }
  const senales = {};
  for (const s of propios) {
    if (!config.variables[s.variable]) continue;
    (senales[s.variable] ??= []).push(s);
  }
  const puntaje = puntajeAlerta(senales, config.variables);
  const anomalos = propios.filter((s) => s.anomala);
  const criticos = propios.filter((s) => s.critico);
  const gases = propios.filter((s) => ['HUMO', 'CO', 'CO2', 'GAS_LEL'].includes(s.variable));
  const evidenciaIncendio = propios.some((s) => config.confirmacion.variablesEvidencia.includes(s.variable) &&
    (s.critico || (s.anomala && s.z > 0)));
  const otrasVariables = anomalos.length === 1 ? propios.filter((s) => s.variable !== anomalos[0].variable) : [];
  const clima = ['TEMPERATURA', 'HUMEDAD'].some((v) => {
    const grupo = todos.filter((s) => s.variable === v && s.fresca);
    return grupo.length >= 3 && grupo.filter((s) => s.anomala).length > grupo.length / 2 &&
      grupo.every((s) => Number.isFinite(s.zrob) && Math.abs(s.zrob) <= 3.5);
  });
  const edad = alerta ? +ahora - +inicioAlerta(alerta) : 0;
  const puedePuntuar = edad >= config.evaluacionMinutos * 60000;
  const decision = clasificarAlerta({
    R: puedePuntuar ? puntaje.R : null,
    umbralConfirmacion: Number(motor.umbral_confirmacion), umbralDescarte: Number(motor.umbral_descarte),
    algunSensorCusumDisparado: propios.some((s) => s.cusumDisparado), evidenciaIncendio,
    gasesNormales: gases.length > 0 && gases.every((s) => s.fresca && Number.isFinite(s.z) && !s.anomala),
    unicoSensorAnomalo: anomalos.length === 1,
    saltoFisicoImposible: anomalos.some((s) => s.saltoFisicoImposible),
    otrasVariablesSinCambios: otrasVariables.length > 0 && otrasVariables.every((s) => s.fresca && Number.isFinite(s.z) && !s.anomala),
    valorCriticoActual: criticos.length > 0,
    respaldoCritico: criticos.some((s) => s.respaldoCritico) || criticos.length > 1,
    otraVariableAnomala: criticos.some((c) => anomalos.some((s) => s.variable !== c.variable)),
    mayoriaVecinosAfectados: puedePuntuar && clima, todosZrobBajoUmbral: clima,
    tiempoEvaluacionVencido: edad >= Number(motor.tiempo_max_evaluacion_min) * 60000,
  });
  return { ...decision, puntaje: puedePuntuar ? puntaje.R : null, sensores: propios,
    datosSuficientes: puedePuntuar && puntaje.R !== null,
    confirmacionDisponible: propios.some((s) => config.confirmacion.variablesEvidencia.includes(s.variable)) };
}
