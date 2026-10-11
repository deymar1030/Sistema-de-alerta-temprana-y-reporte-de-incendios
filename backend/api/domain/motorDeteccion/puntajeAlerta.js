const ESCALA_Z = 5;
const ESCALA_ZROB = 7;

function puntajeDeSensor(senal, bmax) {
  const terminos = [
    { peso: 0.4, valor: senal.z, escala: ESCALA_Z },
    { peso: 0.3, valor: senal.b, escala: bmax },
  ];

  if (Number.isFinite(senal.zrob)) {
    terminos.push({ peso: 0.3, valor: senal.zrob, escala: ESCALA_ZROB });
  }

  const sumaPesos = terminos.reduce((acc, termino) => acc + termino.peso, 0);

  return terminos.reduce((acc, termino) => {
    const normalizado = Math.max(0, Math.min(1, termino.valor / termino.escala));
    return acc + (termino.peso / sumaPesos) * normalizado;
  }, 0);
}

export function puntajeAlerta(senales, parametros) {
  const porSensor = {};
  const porVariable = {};
  const presentes = [];

  for (const [variable, listaSensores] of Object.entries(senales)) {
    const parametro = parametros[variable];
    if (!parametro || !Array.isArray(listaSensores) || listaSensores.length === 0) {
      continue;
    }

    const puntajes = listaSensores.map((senal) => puntajeDeSensor(senal, parametro.bmax));
    porSensor[variable] = puntajes;
    porVariable[variable] = Math.max(...puntajes);
    presentes.push({ peso: parametro.peso, puntaje: porVariable[variable] });
  }

  const sumaPesos = presentes.reduce((acc, presente) => acc + presente.peso, 0);

  const R = sumaPesos === 0
    ? null
    : presentes.reduce(
        (acc, presente) => acc + (presente.peso / sumaPesos) * presente.puntaje,
        0,
      );

  return { porSensor, porVariable, R };
}
