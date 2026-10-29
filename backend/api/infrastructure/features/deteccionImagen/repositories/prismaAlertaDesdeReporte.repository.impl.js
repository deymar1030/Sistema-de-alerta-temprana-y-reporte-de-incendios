import AlertaDesdeReporteRepository from '../../../../application/deteccionImagen/repositories/alertaDesdeReporte.repository.js';
import PrismaReporteURepository from '../../reporteU/repositories/reporteU.repository.impl.js';
import { distribuirAlerta } from '../../alerta/distribuirAlerta.js';
import { tituloAlertaPorUbicacion } from '../../../../domain/deteccionImagen/sugerirNivelPrioridad.js';
import { buscarAlertaCorroborable, puntajeCorroborado } from '../../../../domain/deteccionImagen/buscarAlertaCorroborable.js';

const ALERTAS_ACTIVAS = ['EN_EVALUACION', 'CONFIRMADA', 'ATENDIDA'];

export default class PrismaAlertaDesdeReporteRepository extends AlertaDesdeReporteRepository {
  constructor(prisma) { super(); this.prisma = prisma; }
  async crearReporteConAlerta({ reporteU, prediccion, ahora }) {
    return this.prisma.$transaction(async (db) => {
      const creado = await new PrismaReporteURepository(db).create(reporteU);
      return { reporteU: creado, ...await this.confirmar(db, creado, prediccion, ahora) };
    }, { timeout: 30000 });
  }
  async confirmarIncendio({ reporteU, prediccion, ahora }) {
    return this.prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT id_reporte_u FROM reporte_u WHERE id_reporte_u = ${BigInt(reporteU.id_reporte_u)} FOR UPDATE`;
      const existente = await db.genera_ru.findFirst({ where: { id_reporte_u: BigInt(reporteU.id_reporte_u) }, include: { alerta: true } });
      if (existente) return { alerta: existente.alerta, envios: [], notificaciones: [] };
      return this.confirmar(db, reporteU, prediccion, ahora);
    }, { timeout: 30000 });
  }
  async confirmar(db, reporteU, prediccion, ahora) {
    const corroborable = await this.buscarCorroborable(db, reporteU, ahora);
    if (corroborable) {
      await db.genera_ru.create({ data: { id_alerta: corroborable.alerta.id_alerta, id_reporte_u: BigInt(reporteU.id_reporte_u) } });
      const alerta = await db.alerta.update({
        where: { id_alerta: corroborable.alerta.id_alerta },
        data: { puntaje: puntajeCorroborado(corroborable.alerta.puntaje, prediccion.fire_probability) },
      });
      // Ya se distribuyo cuando se creo; otro reporte corroborando el mismo
      // incendio no reenvia ni renotifica a las instituciones.
      return { alerta, corroboracion: true, envios: [], notificaciones: [] };
    }
    const alerta = await db.alerta.create({ data: {
      fecha: new Date(`${ahora.toISOString().slice(0, 10)}T00:00:00Z`), hora: ahora,
      estado: 'CONFIRMADA', clasificacion: 'INCENDIO', fecha_confirmacion: ahora,
      puntaje: Number(prediccion.fire_probability.toFixed(3)),
    } });
    await db.genera_ru.create({ data: { id_alerta: alerta.id_alerta, id_reporte_u: BigInt(reporteU.id_reporte_u) } });
    const distribucion = await distribuirAlerta(db, {
      alerta, ahora, titulo: tituloAlertaPorUbicacion(reporteU.ubicacion_tipo),
      mensaje: `Reporte ciudadano #${reporteU.id_reporte_u}: deteccion por imagen (${Math.round(prediccion.fire_probability * 100)}%). ${reporteU.ubicacion_tipo === 'CERCANA' ? 'Ubicacion aproximada del reportante.' : 'Ubicacion reportada por el ciudadano.'}`,
      destino_latitud: reporteU.latitud, destino_longitud: reporteU.longitud,
    });
    return { alerta, corroboracion: false, ...distribucion };
  }

  // Si otro ciudadano ya reporto el mismo incendio (alerta activa originada
  // por reporte_u, cerca en espacio/tiempo de este reporte), se corrobora esa
  // en vez de crear una alerta duplicada. Ver buscarAlertaCorroborable.js.
  async buscarCorroborable(db, reporteU, ahora) {
    if (reporteU.latitud == null || reporteU.longitud == null) return null;
    const vinculos = await db.genera_ru.findMany({
      where: { alerta: { estado: { in: ALERTAS_ACTIVAS } } },
      include: { alerta: true, reporte_u: { select: { latitud: true, longitud: true, fecha_envio: true } } },
    });
    const candidatos = vinculos
      .filter((v) => v.reporte_u.latitud != null && v.reporte_u.longitud != null)
      .map((v) => ({
        alerta: v.alerta,
        latitud: Number(v.reporte_u.latitud),
        longitud: Number(v.reporte_u.longitud),
        creada_en: v.reporte_u.fecha_envio,
      }));
    return buscarAlertaCorroborable(candidatos, {
      latitud: Number(reporteU.latitud), longitud: Number(reporteU.longitud), ahora,
    });
  }
}
