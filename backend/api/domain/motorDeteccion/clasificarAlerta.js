const EN_EVALUACION = 'EN_EVALUACION';
const CONFIRMADA = 'CONFIRMADA';
const DESCARTADA = 'DESCARTADA';

export function clasificarAlerta(entrada) {
  const {
    R,
    umbralConfirmacion,
    umbralDescarte,
    algunSensorCusumDisparado,
    humoAnomalo,
    coAnomalo,
    unicoSensorAnomalo,
    saltoFisicoImposible,
    otrasVariablesSinCambios,
    valorCriticoActual,
    respaldoCritico,
    otraVariableAnomala,
    mayoriaVecinosAfectados,
    todosZrobBajoUmbral,
    tiempoEvaluacionVencido,
  } = entrada;

  const rCalculable = R !== null;

  if (unicoSensorAnomalo && saltoFisicoImposible && otrasVariablesSinCambios) {
    return { estado: DESCARTADA, clasificacion: 'FALLA_SENSOR' };
  }

  if (valorCriticoActual && (respaldoCritico || otraVariableAnomala)) {
    return { estado: CONFIRMADA, clasificacion: 'INCENDIO' };
  }

  if (
    rCalculable &&
    R >= umbralConfirmacion &&
    algunSensorCusumDisparado &&
    (humoAnomalo || coAnomalo)
  ) {
    return { estado: CONFIRMADA, clasificacion: 'INCENDIO' };
  }

  if (
    mayoriaVecinosAfectados &&
    todosZrobBajoUmbral &&
    !humoAnomalo &&
    !coAnomalo
  ) {
    return { estado: DESCARTADA, clasificacion: 'CLIMA' };
  }

  if (tiempoEvaluacionVencido || (rCalculable && R < umbralDescarte)) {
    return { estado: DESCARTADA, clasificacion: 'SIN_EVIDENCIA' };
  }

  return { estado: EN_EVALUACION, clasificacion: null };
}
