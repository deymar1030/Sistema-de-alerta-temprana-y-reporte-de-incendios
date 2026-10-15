import LecturaRepository from "../../../../application/lectura/repositories/lectura.repository.js";

function buildWhere(filters) {
  const where = {};

  if (filters.id_sensor) where.id_sensor = Number(filters.id_sensor);
  if (filters.tipo_variable) where.tipo_variable = filters.tipo_variable;
  if (filters.estado_lectura) where.estado_lectura = filters.estado_lectura;
  if (filters.id_predio) where.sensor = { id_predio: Number(filters.id_predio) };

  if (filters.desde || filters.hasta) {
    where.fecha_hora = {};
    if (filters.desde) where.fecha_hora.gte = new Date(filters.desde);
    if (filters.hasta) where.fecha_hora.lte = new Date(filters.hasta);
  }

  return where;
}

export default class PrismaLecturaRepository extends LecturaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findAll(filters, { page, pageSize }) {
    const where = buildWhere(filters);

    const [items, total] = await Promise.all([
      this.prisma.lectura.findMany({
        where,
        orderBy: { fecha_hora: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lectura.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id) {
    return await this.prisma.lectura.findUnique({ where: { id_lectura: id } });
  }

  async create(datos, client = this.prisma) {
    return await client.lectura.create({
      data: {
        id_sensor: Number(datos.id_sensor),
        id_alerta: datos.id_alerta != null ? Number(datos.id_alerta) : null,
        valor: datos.valor,
        fecha_hora: datos.fecha_hora instanceof Date ? datos.fecha_hora : new Date(datos.fecha_hora),
        estado_lectura: datos.estado_lectura,
        tipo_variable: datos.tipo_variable,
      },
    });
  }

  async vincularLecturasPrevias({ id_predio, id_alerta, desde, hasta }, client = this.prisma) {
    return await client.lectura.updateMany({
      where: {
        id_alerta: null,
        sensor: { id_predio: Number(id_predio) },
        fecha_hora: {
          gte: desde instanceof Date ? desde : new Date(desde),
          lte: hasta instanceof Date ? hasta : new Date(hasta),
        },
      },
      data: { id_alerta: Number(id_alerta) },
    });
  }

  async findHistorialBySensor(id_sensor, { desde, hasta }, client = this.prisma) {
    return await client.lectura.findMany({
      where: {
        id_sensor: Number(id_sensor),
        estado_lectura: "VALIDA",
        id_alerta: null,
        fecha_hora: {
          gte: desde instanceof Date ? desde : new Date(desde),
          lte: hasta instanceof Date ? hasta : new Date(hasta),
        },
      },
      select: { valor: true, fecha_hora: true },
      orderBy: { fecha_hora: "asc" },
    });
  }

  async findLecturasRecientes(id_sensor, { desde, hasta }, client = this.prisma) {
    const rango = { gte: desde instanceof Date ? desde : new Date(desde) };
    if (hasta) rango.lte = hasta instanceof Date ? hasta : new Date(hasta);

    return await client.lectura.findMany({
      where: {
        id_sensor: Number(id_sensor),
        estado_lectura: { in: ["VALIDA", "ANOMALA"] },
        fecha_hora: rango,
      },
      select: { valor: true, fecha_hora: true },
      orderBy: { fecha_hora: "asc" },
    });
  }

  async findUltimasLecturas(id_sensor, { limite }, client = this.prisma) {
    const filas = await client.lectura.findMany({
      where: { id_sensor: Number(id_sensor), estado_lectura: { in: ["VALIDA", "ANOMALA"] } },
      select: { valor: true, fecha_hora: true },
      orderBy: { fecha_hora: "desc" },
      take: limite ? Number(limite) : undefined,
    });

    return filas.reverse();
  }
}
