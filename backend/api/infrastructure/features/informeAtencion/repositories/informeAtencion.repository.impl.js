import InformeAtencionRepository from "../../../../application/informeAtencion/repositories/informeAtencion.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function parseHora(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(`1970-01-01T${value}Z`);
}

function parseFecha(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function campos(informeData) {
  return {
    id_alerta: informeData.id_alerta,
    id_institucion: informeData.id_institucion,
    id_usuario: informeData.id_usuario,
    estado: informeData.estado,
    fecha_incidente: parseFecha(informeData.fecha_incidente),
    hora_recepcion: parseHora(informeData.hora_recepcion),
    hora_salida: parseHora(informeData.hora_salida),
    hora_llegada: parseHora(informeData.hora_llegada),
    hora_control: parseHora(informeData.hora_control),
    hora_finalizacion: parseHora(informeData.hora_finalizacion),
    personal: informeData.personal,
    vehiculos: informeData.vehiculos,
    personas_afectadas: informeData.personas_afectadas,
    personas_evacuadas: informeData.personas_evacuadas,
    heridos: informeData.heridos,
    fallecidos: informeData.fallecidos,
    danos_materiales: informeData.danos_materiales,
    causa: informeData.causa,
    acciones: informeData.acciones,
    observaciones: informeData.observaciones,
    recomendaciones: informeData.recomendaciones,
  };
}

export default class PrismaInformeAtencionRepository extends InformeAtencionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(informeData) {
    return await this.prisma.informe_atencion.create({ data: limpiar(campos(informeData)) });
  }

  // Crea el informe y, si nace ya COMPLETADO, cierra la alerta en la misma
  // transaccion (ver cerrarAlertaPorInforme). No es el caso usual: lo normal
  // es crear en BORRADOR y completar despues via update().
  async crearYEvaluarCierre(informeData) {
    return this.prisma.$transaction(async (db) => {
      const informe = await db.informe_atencion.create({ data: limpiar(campos(informeData)) });
      const alerta_actualizada = informeData.estado === 'COMPLETADO'
        ? await this.cerrarAlertaPorInforme(db, informe.id_alerta)
        : null;
      return { informe, alerta_actualizada };
    });
  }

  // Actualiza el informe y, solo en la transicion BORRADOR -> COMPLETADO,
  // cierra la alerta y libera a los OPERATIVO asignados. Idempotente: pedir
  // COMPLETADO de nuevo sobre un informe ya COMPLETADO no reabre nada.
  async actualizarYEvaluarCierre(id, informeData, { id_alerta, yaCompletado }) {
    return this.prisma.$transaction(async (db) => {
      const informe = await db.informe_atencion.update({ where: { id_informe_atencion: id }, data: limpiar(campos(informeData)) });
      const cierra = informeData.estado === 'COMPLETADO' && !yaCompletado;
      const alerta_actualizada = cierra ? await this.cerrarAlertaPorInforme(db, id_alerta) : null;
      return { informe, alerta_actualizada };
    });
  }

  // No toca alertas ya DESCARTADA/CERRADA (p. ej. doble envio del formulario).
  async cerrarAlertaPorInforme(db, id_alerta) {
    const ahora = new Date();
    const { count } = await db.alerta.updateMany({
      where: { id_alerta: BigInt(id_alerta), estado: { notIn: ['CERRADA', 'DESCARTADA'] } },
      data: { estado: 'CERRADA', fecha_cierre: ahora },
    });
    if (count === 0) return null;
    await db.recepciona.updateMany({
      where: { id_alerta: BigInt(id_alerta), estado: 'ASIGNADO' },
      data: { estado: 'LIBERADO', fecha_liberacion: ahora },
    });
    return db.alerta.findUnique({ where: { id_alerta: BigInt(id_alerta) } });
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.id_institucion) where.id_institucion = Number(filters.id_institucion);
    if (filters.id_alerta) where.id_alerta = Number(filters.id_alerta);
    if (filters.estado) where.estado = filters.estado;

    return await this.prisma.informe_atencion.findMany({
      where,
      orderBy: { id_informe_atencion: "desc" },
    });
  }

  async findById(id) {
    return await this.prisma.informe_atencion.findUnique({ where: { id_informe_atencion: id } });
  }

  async update(id, informeData) {
    return await this.prisma.informe_atencion.update({
      where: { id_informe_atencion: id },
      data: limpiar(campos(informeData)),
    });
  }
}
