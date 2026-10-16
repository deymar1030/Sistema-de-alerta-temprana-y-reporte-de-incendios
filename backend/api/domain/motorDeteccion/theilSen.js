import { numeroFinito, mediana } from './estadistica.js';

export function theilSen(lecturas) {
  if (!Array.isArray(lecturas)) throw new TypeError('lecturas debe ser un arreglo');
  const tiempos = lecturas.map((l) => {
    numeroFinito(l.valor, 'valor');
    if (l.fecha_hora == null) throw new TypeError('fecha_hora requerida');
    return numeroFinito(new Date(l.fecha_hora).getTime(), 'fecha_hora');
  });
  const pendientes = [];
  for (let i = 0; i < lecturas.length; i++) {
    for (let j = i + 1; j < lecturas.length; j++) {
      const minutos = (tiempos[j] - tiempos[i]) / 60000;
      if (minutos !== 0) pendientes.push((lecturas[j].valor - lecturas[i].valor) / minutos);
    }
  }
  return { pendiente: mediana(pendientes), calculable: pendientes.length > 0 };
}
