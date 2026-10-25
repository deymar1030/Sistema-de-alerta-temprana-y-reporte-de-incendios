// La zona del predio no limita los destinatarios: se envia a toda
// institucion activa. La asignacion a personal OPERATIVO puntual la hace el
// JEFE_INSTITUCION despues, via POST /api/notificaciones/asignaciones.
//
// destino_latitud/longitud (del predio o del reporte ciudadano) viajan en
// rutasPendientes junto a la ubicacion de cada institucion, para que el
// llamador calcule las rutas despues del commit. No se calculan aca: esta
// funcion corre dentro de una transaccion de Prisma, y una llamada HTTP no
// debe demorarla ni terminar escribiendo con un cliente transaccional que ya
// se cerro. rutasPendientes queda separado de envios a proposito: envios se
// emite tal cual por WebSocket y no debe ganar campos nuevos sin querer.
export async function distribuirAlerta(db, { alerta, ahora, titulo, mensaje, destino_latitud = null, destino_longitud = null }) {
  const instituciones = await db.institucion.findMany({ where: { estado: true }, select: { id_institucion: true, latitud: true, longitud: true } });
  const envios = [];
  const rutasPendientes = [];
  for (const institucion of instituciones) {
    const envio = await db.envia.create({ data: {
      id_alerta: alerta.id_alerta, id_institucion: institucion.id_institucion,
      estado: 'ENVIADA', fecha_envio: ahora,
    } });
    envios.push(envio);
    if (institucion.latitud != null && institucion.longitud != null && destino_latitud != null && destino_longitud != null) {
      rutasPendientes.push({
        id_alerta: alerta.id_alerta, id_institucion: institucion.id_institucion,
        origen_latitud: Number(institucion.latitud), origen_longitud: Number(institucion.longitud),
        destino_latitud: Number(destino_latitud), destino_longitud: Number(destino_longitud),
      });
    }
  }
  const jefes = await db.usuario.findMany({ where: {
    estado: true, fecha_eliminacion: null,
    id_institucion: { in: instituciones.map((i) => i.id_institucion) },
    rol: { nombre_rol: 'JEFE_INSTITUCION' },
  }, select: { id_usuario: true } });
  const notificaciones = [];
  for (const jefe of jefes) {
    notificaciones.push(await db.notificacion.create({ data: {
      id_usuario: jefe.id_usuario, id_alerta: alerta.id_alerta,
      tipo: 'ALERTA', titulo, mensaje, fecha_hora: ahora,
    } }));
  }
  return { envios, notificaciones, rutasPendientes };
}
