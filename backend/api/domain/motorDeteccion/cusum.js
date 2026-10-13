export function cusum(zRecientes, cusumH, cusumK, cusumVentanaLecturas) {
  const ventana = zRecientes.slice(-cusumVentanaLecturas);

  let acumulado = 0;
  for (const z of ventana) {
    acumulado = Math.max(0, acumulado + z - cusumK);
  }

  return { acumulado, disparado: acumulado > cusumH };
}
