import { DeteccionRepository } from '../../../../application/lectura/repositories/deteccion.repository.js';
import { distanciaMetros } from '../../../../domain/motorDeteccion/evaluarPredio.js';
import { normalizarVariable } from '../../../../domain/sensor/tiposSensor.js';

const activa = { fecha_cierre: null, estado: { in: ['EN_EVALUACION', 'CONFIRMADA', 'ATENDIDA'] } };
const delPredio = (id) => ({ lectura: { some: { sensor: { id_predio: BigInt(id) } } } });
const numeroLectura = (l) => ({ ...l, valor: Number(l.valor) });

class TransaccionDeteccion {
  constructor(db) { this.db = db; }
  sensor(id) { return this.db.sensor.findUnique({ where: { id_sensor: BigInt(id) } }); }
  duplicada(l) {
    return this.db.lectura.findFirst({ where: { id_sensor: BigInt(l.id_sensor), fecha_hora: l.fecha_hora, valor: l.valor } });
  }
  ultima(id) {
    return this.db.lectura.findFirst({ where: { id_sensor: BigInt(id), estado_lectura: { not: 'INVALIDA' } }, orderBy: { fecha_hora: 'desc' } });
  }
  alertaActiva(id) { return this.db.alerta.findFirst({ where: { ...activa, ...delPredio(id) }, orderBy: { id_alerta: 'desc' } }); }
  ultimoDescarte(id) {
    return this.db.alerta.findFirst({ where: { ...delPredio(id), estado: 'DESCARTADA', fecha_cierre: { not: null } }, orderBy: { fecha_cierre: 'desc' } });
  }
  async contexto(id, ahora) {
    const predio = await this.db.predio.findUnique({ where: { id_predio: BigInt(id) }, include: { motor_det: { include: { parametro_variable: true } } } });
    if (!predio) return null;
    const desde = new Date(+ahora - Number(predio.motor_det.ventana_base_min) * 60000);
    const lecturas = { where: { fecha_hora: { gte: desde, lte: ahora }, estado_lectura: { not: 'INVALIDA' } }, orderBy: { fecha_hora: 'asc' } };
    const sensores = await this.db.sensor.findMany({ where: { id_predio: BigInt(id), estado: 'ACTIVO' }, include: { lectura: lecturas } });
    const radio = Number(predio.motor_det.radio_vecindad_m);
    const deltaLat = radio / 111000;
    const deltaLon = deltaLat / Math.max(0.01, Math.cos(Number(predio.latitud) * Math.PI / 180));
    const candidatos = await this.db.predio.findMany({ where: {
      id_predio: { not: BigInt(id) }, tipo_predio: predio.tipo_predio,
      latitud: { gte: Number(predio.latitud) - deltaLat, lte: Number(predio.latitud) + deltaLat },
      longitud: { gte: Number(predio.longitud) - deltaLon, lte: Number(predio.longitud) + deltaLon },
      NOT: { sensor: { some: { lectura: { some: { alerta: activa } } } } },
    }, select: { id_predio: true, latitud: true, longitud: true } });
    const ids = candidatos.filter((p) => distanciaMetros(predio, p) <= radio).map((p) => p.id_predio);
    const vecinos = ids.length ? await this.db.sensor.findMany({ where: { id_predio: { in: ids }, estado: 'ACTIVO' }, include: { lectura: lecturas } }) : [];
    const convertir = ({ lectura, ...s }) => ({ ...s, lecturas: lectura.map(numeroLectura) });
    return { predio, motor: predio.motor_det, sensores: sensores.map(convertir), vecinos: vecinos.map(convertir) };
  }
  registrarLectura(l, sensor, estado, idAlerta = null) {
    return this.db.lectura.create({ data: { id_sensor: sensor.id_sensor, id_alerta: idAlerta,
      valor: l.valor, fecha_hora: l.fecha_hora, estado_lectura: estado, tipo_variable: normalizarVariable(sensor.tipo_sensor) } });
  }
  async abrirAlerta(idPredio, ahora, contextoMinutos) {
    const alerta = await this.db.alerta.create({ data: {
      fecha: new Date(`${ahora.toISOString().slice(0, 10)}T00:00:00Z`), hora: ahora, estado: 'EN_EVALUACION',
    } });
    await this.db.lectura.updateMany({ where: { sensor: { id_predio: BigInt(idPredio) }, id_alerta: null,
      estado_lectura: { not: 'INVALIDA' }, fecha_hora: { gte: new Date(+ahora - contextoMinutos * 60000), lte: ahora } },
      data: { id_alerta: alerta.id_alerta } });
    return alerta;
  }
  actualizarAlerta(alerta, resultado, ahora) {
    const data = { estado: resultado.estado, clasificacion: resultado.clasificacion,
      puntaje: resultado.puntaje == null ? null : Number(resultado.puntaje.toFixed(3)) };
    if (resultado.estado === 'CONFIRMADA') data.fecha_confirmacion = ahora;
    if (resultado.estado === 'DESCARTADA') data.fecha_cierre = ahora;
    return this.db.alerta.update({ where: { id_alerta: alerta.id_alerta }, data });
  }
  async distribuir(alerta, predio, ahora) {
    const instituciones = await this.db.institucion.findMany({ where: { estado: true, cubre_jurisdiccion: { some: { id_zona: predio.id_zona } } } });
    if (!instituciones.length) return { envios: [], notificaciones: [] };
    const envios = [];
    for (const i of instituciones) {
      envios.push(await this.db.envia.create({ data: { id_alerta: alerta.id_alerta, id_institucion: i.id_institucion, estado: 'ENVIADA', fecha_envio: ahora } }));
    }
    const jefes = await this.db.usuario.findMany({ where: { estado: true, fecha_eliminacion: null,
      id_institucion: { in: instituciones.map((i) => i.id_institucion) }, rol: { nombre_rol: 'JEFE_INSTITUCION' } }, select: { id_usuario: true } });
    const notificaciones = [];
    for (const jefe of jefes) {
      notificaciones.push(await this.db.notificacion.create({ data: {
        id_usuario: jefe.id_usuario, id_alerta: alerta.id_alerta, tipo: 'ALERTA',
        titulo: 'Incendio confirmado', mensaje: `Alerta #${alerta.id_alerta} en ${predio.nombre}.`, fecha_hora: ahora,
      } }));
    }
    return { envios, notificaciones };
  }
  async detalle(alerta) {
    const lecturas = await this.db.lectura.findMany({ where: { id_alerta: alerta.id_alerta }, orderBy: { fecha_hora: 'asc' } });
    const instituciones_notificadas = await this.db.envia.findMany({ where: { id_alerta: alerta.id_alerta }, include: { institucion: { select: { nombre: true } } } });
    return { lecturas: lecturas.map(numeroLectura), instituciones_notificadas: instituciones_notificadas.map(({ institucion, ...e }) => ({ ...e, nombre: institucion.nombre })), reporte_origen: null };
  }
}

export class PrismaDeteccionRepository extends DeteccionRepository {
  constructor(prisma) { super(); this.prisma = prisma; }
  enPredio(id, trabajo) {
    return this.prisma.$transaction(async (db) => {
      // Serializa ingesta, timeout y multiples procesos sin columnas/indices nuevos.
      const rows = await db.$queryRaw`SELECT id_predio FROM predio WHERE id_predio = ${BigInt(id)} FOR UPDATE`;
      if (!rows.length) return { ignorada: 'PREDIO_NO_REGISTRADO', eventos: [] };
      return trabajo(new TransaccionDeteccion(db));
    }, { maxWait: 10000, timeout: 30000 });
  }
  async prediosEnEvaluacion() {
    const filas = await this.prisma.sensor.findMany({ where: { lectura: { some: { alerta: { estado: 'EN_EVALUACION', fecha_cierre: null } } } },
      select: { id_predio: true }, distinct: ['id_predio'] });
    return filas.map((p) => p.id_predio);
  }
}
