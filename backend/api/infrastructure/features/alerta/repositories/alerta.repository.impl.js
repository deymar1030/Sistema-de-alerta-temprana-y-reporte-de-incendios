import AlertaRepository from "../../../../application/alerta/repositories/alerta.repository.js";

const ESTADOS_ACTIVOS = ["EN_EVALUACION", "CONFIRMADA", "ATENDIDA"];

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function buildWhere(filters = {}) {
  const where = {};

  if (filters.estado) where.estado = filters.estado;
  if (filters.clasificacion) where.clasificacion = filters.clasificacion;
  if (filters.id_zona) where.lectura = { some: { sensor: { predio: { id_zona: Number(filters.id_zona) } } } };
  if (filters.id_institucion) where.envia = { some: { id_institucion: Number(filters.id_institucion) } };

  if (filters.desde || filters.hasta) {
    where.fecha = {};
    if (filters.desde) where.fecha.gte = new Date(filters.desde);
    if (filters.hasta) where.fecha.lte = new Date(filters.hasta);
  }

  return where;
}

export default class PrismaAlertaRepository extends AlertaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findAll(filters) {
    return await this.prisma.alerta.findMany({
      where: buildWhere(filters),
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    });
  }

  async findActivas(filters) {
    const where = buildWhere(filters);
    where.estado = { in: ESTADOS_ACTIVOS };

    return await this.prisma.alerta.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    });
  }

  async findById(id) {
    return await this.prisma.alerta.findUnique({ where: { id_alerta: id } });
  }

  async findLecturasByAlerta(id_alerta) {
    return await this.prisma.lectura.findMany({
      where: { id_alerta },
      orderBy: { fecha_hora: "asc" },
    });
  }

  async findPredioByAlerta(id_alerta) {
    const lectura = await this.prisma.lectura.findFirst({
      where: { id_alerta },
      include: { sensor: { include: { predio: true } } },
    });

    return lectura?.sensor?.predio ?? null;
  }

  async findInstitucionesNotificadas(id_alerta) {
    return await this.prisma.envia.findMany({
      where: { id_alerta },
      include: { institucion: true },
    });
  }

  async findReporteOrigen(id_alerta) {
    const vinculo = await this.prisma.genera_ru.findFirst({
      where: { id_alerta },
      include: { reporte_u: true },
    });

    return vinculo?.reporte_u ?? null;
  }

  async findActivaByPredio(id_predio, client = this.prisma) {
    return await client.alerta.findFirst({
      where: {
        estado: { in: ESTADOS_ACTIVOS },
        lectura: { some: { sensor: { id_predio: Number(id_predio) } } },
      },
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    });
  }

  async findUltimaDescartadaByPredio(id_predio, client = this.prisma) {
    return await client.alerta.findFirst({
      where: {
        estado: "DESCARTADA",
        lectura: { some: { sensor: { id_predio: Number(id_predio) } } },
      },
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
    });
  }

  async create(datos, client = this.prisma) {
    return await client.alerta.create({
      data: limpiar({
        fecha: datos.fecha instanceof Date ? datos.fecha : new Date(datos.fecha),
        hora: datos.hora instanceof Date ? datos.hora : new Date(datos.hora),
        estado: datos.estado,
        puntaje: datos.puntaje,
        clasificacion: datos.clasificacion,
        fecha_confirmacion:
          datos.fecha_confirmacion instanceof Date ? datos.fecha_confirmacion : datos.fecha_confirmacion,
        fecha_cierre: datos.fecha_cierre instanceof Date ? datos.fecha_cierre : datos.fecha_cierre,
      }),
    });
  }

  async update(id_alerta, datos, client = this.prisma) {
    return await client.alerta.update({
      where: { id_alerta: Number(id_alerta) },
      data: limpiar({
        estado: datos.estado,
        puntaje: datos.puntaje,
        clasificacion: datos.clasificacion,
        fecha_confirmacion:
          datos.fecha_confirmacion instanceof Date ? datos.fecha_confirmacion : datos.fecha_confirmacion,
        fecha_cierre: datos.fecha_cierre instanceof Date ? datos.fecha_cierre : datos.fecha_cierre,
      }),
    });
  }
}
