// Filas de `recepciona` (con usuario.id_institucion e institucion.nombre) ->
// una entrada por institucion con cuantos operativos tiene asignados.
export function agruparPorInstitucion(filas = []) {
  const porInstitucion = new Map();
  for (const { usuario } of filas) {
    if (usuario?.id_institucion == null) continue;
    const id = Number(usuario.id_institucion);
    const actual = porInstitucion.get(id) ?? { id_institucion: id, nombre: usuario.institucion?.nombre ?? null, operativos: 0 };
    actual.operativos += 1;
    porInstitucion.set(id, actual);
  }
  return [...porInstitucion.values()];
}
