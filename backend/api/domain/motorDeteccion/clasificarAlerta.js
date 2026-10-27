export function clasificarAlerta({
  R, umbralConfirmacion, umbralDescarte, algunSensorCusumDisparado,
  humoAnomalo, coAnomalo, unicoSensorAnomalo, saltoFisicoImposible,
  otrasVariablesSinCambios, valorCriticoActual, respaldoCritico, otraVariableAnomala,
  mayoriaVecinosAfectados, todosZrobBajoUmbral, tiempoEvaluacionVencido,
  evidenciaIncendio = humoAnomalo === true || coAnomalo === true,
  gasesNormales = humoAnomalo === false && coAnomalo === false,
  permiteConfirmacion = true,
}) {
  const rCalculable = Number.isFinite(R) && R >= 0 && R <= 1;
  if (unicoSensorAnomalo && saltoFisicoImposible && otrasVariablesSinCambios) {
    return { estado: 'DESCARTADA', clasificacion: 'FALLA_SENSOR' };
  }
  if (permiteConfirmacion && evidenciaIncendio &&
      ((valorCriticoActual && (respaldoCritico || otraVariableAnomala)) ||
       (rCalculable && R >= umbralConfirmacion && algunSensorCusumDisparado))) {
    return { estado: 'CONFIRMADA', clasificacion: 'INCENDIO' };
  }
  if (mayoriaVecinosAfectados && todosZrobBajoUmbral && gasesNormales === true) {
    return { estado: 'DESCARTADA', clasificacion: 'CLIMA' };
  }
  if (tiempoEvaluacionVencido || (rCalculable && R < umbralDescarte)) {
    return { estado: 'DESCARTADA', clasificacion: 'SIN_EVIDENCIA' };
  }
  return { estado: 'EN_EVALUACION', clasificacion: null };
}
