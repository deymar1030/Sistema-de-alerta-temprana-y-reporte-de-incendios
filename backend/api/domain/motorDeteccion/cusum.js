export function cusum(zRecientes, cusumH, k = 0.5) {
  const ventana = zRecientes.slice(-20);

  let acumulado = 0;
  for (const z of ventana) {
    acumulado = Math.max(0, acumulado + z - k);
  }

  return { acumulado, disparado: acumulado > cusumH };
}
