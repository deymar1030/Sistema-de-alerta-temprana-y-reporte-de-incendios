import { positivo } from './estadistica.js';

function puntajeSensor({ z, b, zrob }, bmax) {
  if (!Number.isFinite(z) || !Number.isFinite(b)) return null;
  const recortar = (v) => Math.max(0, Math.min(1, v));
  const parcial = 0.4 * recortar(z / 5) + 0.3 * recortar(b / bmax);
  return Number.isFinite(zrob) ? parcial + 0.3 * recortar(zrob / 7) : parcial / 0.7;
}

// Incluir [] para una variable instalada sin datos. Omitir solo variables no instaladas.
export function puntajeAlerta(senales, parametros) {
  const porSensor = {}, porVariable = {};
  let sumaPesos = 0, suma = 0, incompleto = false;
  for (const [variable, sensores] of Object.entries(senales)) {
    const parametro = parametros[variable];
    if (!parametro) continue;
    positivo(parametro.peso, `peso de ${variable}`);
    positivo(parametro.bmax, `bmax de ${variable}`);
    if (!Array.isArray(sensores)) throw new TypeError('Lista de sensores invalida');
    const puntajes = sensores.map((s) => puntajeSensor(s, parametro.bmax));
    porSensor[variable] = puntajes;
    const calculables = puntajes.filter(Number.isFinite);
    porVariable[variable] = calculables.length ? Math.max(...calculables) : null;
    if (!calculables.length) incompleto = true;
    sumaPesos += parametro.peso;
    suma += parametro.peso * (porVariable[variable] ?? 0);
  }
  return { porSensor, porVariable, R: incompleto || !sumaPesos ? null : suma / sumaPesos };
}
