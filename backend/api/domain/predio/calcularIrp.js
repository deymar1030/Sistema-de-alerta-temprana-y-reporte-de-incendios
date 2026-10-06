export function calcularIrp({
  estado_electrico,
  estado_gas,
  fuentes_calor,
  carga_combustible,
  material_construccion,
  ocupacion,
  nivel_proteccion,
}) {
  if (
    estado_electrico == null ||
    estado_gas == null ||
    fuentes_calor == null ||
    carga_combustible == null ||
    material_construccion == null ||
    ocupacion == null ||
    nivel_proteccion == null
  ) {
    return null;
  }

  const normalizar = (v, min, max) => 0.1 + (0.9 * (v - min)) / (max - min);

  const nElec = normalizar(estado_electrico, 1, 3);
  const nGas = normalizar(estado_gas, 0, 2);
  const nCalor = normalizar(fuentes_calor, 0, 2);
  const nCarga = normalizar(carga_combustible, 1, 3);
  const nMat = normalizar(material_construccion, 1, 3);
  const nOcup = normalizar(ocupacion, 1, 3);

  const p = (nElec + nGas + nCalor) / 3;
  const c = (nCarga + nMat + nOcup) / 3;
  const m = nivel_proteccion / 3;

  const irp = Math.sqrt(p * c) * (1 - 0.4 * m);

  return Math.round(irp * 1000) / 1000;
}
