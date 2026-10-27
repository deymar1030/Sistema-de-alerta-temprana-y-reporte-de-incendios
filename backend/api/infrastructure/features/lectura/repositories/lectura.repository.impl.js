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
}
