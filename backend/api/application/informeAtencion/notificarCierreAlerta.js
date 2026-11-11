// Si cerrarAlertaPorInforme certifico el cierre (alerta_actualizada no es
// null -- la alerta ya estaba CERRADA/DESCARTADA y este informe no hizo
// nada, o SI la cerro recien), avisa en vivo a los paneles institucionales
// y de administracion (mismo canal que ya escuchan: alerta:actualizada) y,
// si la alerta nacio de uno o mas reportes ciudadanos, notifica a quienes
// la reportaron: el incendio ya se controlo, no hace falta seguir
// reportandolo.
export async function notificarCierreAlerta(alerta_actualizada, { reporteURepository, notificacionRepository, realtimeNotifier, logger = console }) {
  if (!alerta_actualizada) return;

  try { await realtimeNotifier?.emitAlertaActualizada(alerta_actualizada); }
  catch (error) { logger.error("[informeAtencion] emitAlertaActualizada no entregado", error.message); }

  const idsCiudadanos = await reporteURepository.findCiudadanosByAlerta(alerta_actualizada.id_alerta);
  if (!idsCiudadanos.length) return;

  const notificacionesData = idsCiudadanos.map((id_usuario) => ({
    id_usuario,
    id_alerta: alerta_actualizada.id_alerta,
    tipo: "ALERTA",
    titulo: "Incendio controlado",
    mensaje: "El incendio que reportaste ya fue controlado y la atención finalizó.",
  }));

  let notificaciones;
  try {
    notificaciones = await notificacionRepository.createMany(notificacionesData);
  } catch (error) {
    logger.error("[informeAtencion] no se pudieron crear las notificaciones de cierre", error.message);
    return;
  }

  for (const notificacion of notificaciones) {
    try { await realtimeNotifier?.emitNotificacion(notificacion); }
    catch (error) { logger.error("[informeAtencion] emitNotificacion no entregado", error.message); }
  }
}
