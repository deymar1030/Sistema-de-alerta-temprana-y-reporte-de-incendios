export function numeroFinito(valor, nombre) {
  if (!Number.isFinite(valor)) throw new TypeError(`${nombre} debe ser un numero finito`);
  return valor;
}
export function positivo(valor, nombre) {
  numeroFinito(valor, nombre);
  if (valor <= 0) throw new RangeError(`${nombre} debe ser mayor que cero`);
  return valor;
}
export function numeros(valores, nombre) {
  if (!Array.isArray(valores)) throw new TypeError(`${nombre} debe ser un arreglo`);
  valores.forEach((v) => numeroFinito(v, nombre));
}
export function mediana(valores) {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[medio] : (ordenados[medio - 1] + ordenados[medio]) / 2;
}
