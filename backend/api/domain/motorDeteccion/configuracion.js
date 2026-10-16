import { positivo } from './estadistica.js';
import { normalizarVariable } from '../sensor/tiposSensor.js';

// Valores del PDF para sus variables. CO2/%LEL: escalas de SIMULACION,
// no limites de incendio, exposicion humana ni calibracion de hardware.
export const CONFIGURACION_BASE = {
  minLecturasBase: 6,
  frescuraSegundos: 120,
  evaluacionMinutos: 2,
  contextoMinutos: 5,
  esperaMinutos: 15,
  variables: {
    TEMPERATURA: { peso: 0.25, bmax: 10, madMin: 0.1, signo: 1, unidad: '°C' },
    HUMEDAD: { peso: 0.20, bmax: 10, madMin: 0.5, signo: -1, unidad: '%' },
    HUMO: { peso: 0.30, bmax: 100, madMin: 1, signo: 1, unidad: 'µg/m³' },
    CO: { peso: 0.25, bmax: 50, madMin: 1, signo: 1, unidad: 'ppm' },
    CO2: { peso: 0.30, bmax: 300, madMin: 15, signo: 1, unidad: 'ppm' },
    GAS_LEL: { peso: 0.25, bmax: 5, madMin: 0.6, signo: 1, unidad: '%LEL' },
  },
  confirmacion: {
    variablesEvidencia: ['HUMO', 'CO'],
    permitirGasesSimulados: false,
  },
};

export function resolverConfiguracion(motor, personalizada = {}) {
  const especifica = personalizada.motores?.[String(motor.id_motordet)] ?? {};
  const config = { ...CONFIGURACION_BASE, ...personalizada, ...especifica };
  config.confirmacion = { ...CONFIGURACION_BASE.confirmacion, ...personalizada.confirmacion, ...especifica.confirmacion };
  config.variables = {};
  for (const fila of motor.parametro_variable ?? []) {
    const variable = normalizarVariable(fila.tipo_variable);
    const base = CONFIGURACION_BASE.variables[variable];
    if (!base) continue;
    const p = { ...base, ...personalizada.variables?.[variable], ...especifica.variables?.[variable] };
    for (const clave of ['peso', 'bmax', 'madMin']) positivo(p[clave], `${variable}.${clave}`);
    if (![1, -1].includes(p.signo)) throw new Error(`Signo invalido: ${variable}`);
    if (p.maxSaltoPorMinuto != null) positivo(p.maxSaltoPorMinuto, `${variable}.maxSaltoPorMinuto`);
    p.umbralCritico = fila.umbral_critico == null ? null : Number(fila.umbral_critico);
    if (p.umbralCritico != null) positivo(p.umbralCritico, `${variable}.umbralCritico`);
    config.variables[variable] = p;
  }
  for (const clave of ['minLecturasBase', 'frescuraSegundos', 'evaluacionMinutos', 'contextoMinutos', 'esperaMinutos']) positivo(config[clave], clave);
  if (!Number.isInteger(config.minLecturasBase) || config.minLecturasBase < 3) throw new Error('minLecturasBase debe ser entero >= 3');
  if (!Array.isArray(config.confirmacion.variablesEvidencia) || !config.confirmacion.variablesEvidencia.length ||
      config.confirmacion.variablesEvidencia.some((v) => !['HUMO', 'CO', 'CO2', 'GAS_LEL'].includes(v))) {
    throw new Error('variablesEvidencia debe contener gases conocidos');
  }
  if (config.confirmacion.variablesEvidencia.some((v) => ['CO2', 'GAS_LEL'].includes(v)) &&
      config.confirmacion.permitirGasesSimulados !== true) {
    throw new Error('Confirmacion con CO2/GAS_LEL requiere configuracion explicita validada');
  }
  for (const clave of ['ventana_base_min', 'umbral_z', 'cusum_h', 'umbral_confirmacion', 'umbral_descarte', 'tiempo_max_evaluacion_min', 'radio_vecindad_m']) {
    positivo(Number(motor[clave]), clave);
  }
  if (Number(motor.umbral_descarte) >= Number(motor.umbral_confirmacion) || Number(motor.umbral_confirmacion) > 1) {
    throw new Error('Umbrales de puntaje invalidos');
  }
  return config;
}
