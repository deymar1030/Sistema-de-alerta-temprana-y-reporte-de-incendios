export default class AlertaDesdeReporteRepository {
  // Confirma un incendio detectado por IA sobre un reporte ciudadano: crea
  // la alerta ya CONFIRMADA, la vincula al reporte (genera_ru) y distribuye
  // envios/notificaciones a todas las instituciones registradas.
  async crearReporteConAlerta({ reporteU, prediccion, ahora }) {
    throw new Error('Method not implemented');
  }
  async confirmarIncendio({ reporteU, prediccion, ahora }) {
    throw new Error("Method not implemented");
  }
}
