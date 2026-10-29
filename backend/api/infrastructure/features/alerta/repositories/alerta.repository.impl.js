import AlertaRepository from "../../../../application/alerta/repositories/alerta.repository.js";

const ESTADOS_ACTIVOS = ["EN_EVALUACION", "CONFIRMADA", "ATENDIDA"];

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

// Cuando el llamador filtra por su propia institucion, trae tambien SU fila
// de `envia` (ENVIADA/RECIBIDA/ATENDIDA/CERRADA): es el estado operativo real
// para esa institucion, distinto del estado global de la alerta (compartido
// por todas las instituciones notificadas). Sin esto, el movil no tiene forma
// de saber si YA confirmo recepcion sin pedir el detalle alerta por alerta.
function includeMiEnvio(filters) {
  return filters.id_institucion
    ? { envia: { where: { id_institucion: Number(filters.id_institucion) }, take: 1 } }
    : undefined;
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
      include: includeMiEnvio(filters),
    });
  }

  async findActivas(filters) {
    const where = buildWhere(filters);
    where.estado = { in: ESTADOS_ACTIVOS };

    return await this.prisma.alerta.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      include: includeMiEnvio(filters),
    });
  }

  async findById(id) {
    return await this.prisma.alerta.findUnique({ where: { id_alerta: id } });
  }

  async findMapa(filters) {
    const where = buildWhere(filters);
    where.estado = { in: ESTADOS_ACTIVOS };

    return await this.prisma.alerta.findMany({
      where,
      orderBy: [{ fecha: "desc" }, { hora: "desc" }],
      include: {
        lectura: {
          take: 1,
          include: { sensor: { include: { predio: true } } },
        },
        genera_ru: {
          take: 1,
          include: { reporte_u: true },
        },
        ...includeMiEnvio(filters),
      },
    });
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
}
