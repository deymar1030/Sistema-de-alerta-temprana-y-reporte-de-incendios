export function theilSen(lecturas) {
  const tiempos = lecturas.map((lectura) => new Date(lectura.fecha_hora).getTime());
  const pendientes = [];

  for (let i = 0; i < lecturas.length; i += 1) {
    for (let j = i + 1; j < lecturas.length; j += 1) {
      const minutos = (tiempos[j] - tiempos[i]) / 60000;
      if (minutos === 0) continue;
      pendientes.push((lecturas[j].valor - lecturas[i].valor) / minutos);
    }
  }

  if (pendientes.length === 0) {
    return { pendiente: null, calculable: false };
  }

  pendientes.sort((a, b) => a - b);
  const medio = Math.floor(pendientes.length / 2);
  const pendiente =
    pendientes.length % 2 === 1
      ? pendientes[medio]
      : (pendientes[medio - 1] + pendientes[medio]) / 2;

  return { pendiente, calculable: true };
}
