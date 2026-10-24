// La zona del predio no limita los destinatarios: se envia a toda
// institucion activa. La asignacion a personal OPERATIVO puntual la hace el
// JEFE_INSTITUCION despues, via POST /api/notificaciones/asignaciones.
export async function distribuirAlerta(db, { alerta, ahora, titulo, mensaje }) {
  const instituciones = await db.institucion.findMany({ where: { estado: true }, select: { id_institucion: true } });
  const envios = [];
  for (const institucion of instituciones) {
    envios.push(await db.envia.create({ data: {
      id_alerta: alerta.id_alerta, id_institucion: institucion.id_institucion,
      estado: 'ENVIADA', fecha_envio: ahora,
    } }));
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
  return { envios, notificaciones };
}
