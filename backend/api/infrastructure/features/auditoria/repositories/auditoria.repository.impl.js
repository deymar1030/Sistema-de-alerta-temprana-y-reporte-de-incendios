import AuditoriaRepository from "../../../../application/auditoria/repositories/auditoria.repository.js";

export default class PrismaAuditoriaRepository extends AuditoriaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // Solo SELECT en este archivo: ver nota en application/auditoria/repositories/auditoria.repository.js.
  async findAll(filters = {}) {
    const { evento, desde, hasta } = filters;

    const where = {};
    if (evento) where.evento = evento;
    if (desde || hasta) {
      where.fecha_hora = {};
      if (desde) where.fecha_hora.gte = new Date(desde);
      if (hasta) where.fecha_hora.lte = new Date(hasta);
    }

    return await this.prisma.auditoria.findMany({
      where,
      orderBy: { fecha_hora: "desc" },
    });
  }

  async findAllUsuario(filters = {}) {
    const { id_usuario, accion, desde, hasta } = filters;

    const where = {};
    if (id_usuario) where.id_usuario = Number(id_usuario);
    if (accion) where.accion = accion;
    if (desde || hasta) {
      where.fecha_hora = {};
      if (desde) where.fecha_hora.gte = new Date(desde);
      if (hasta) where.fecha_hora.lte = new Date(hasta);
    }

    return await this.prisma.auditoriau.findMany({
      where,
      orderBy: { fecha_hora: "desc" },
    });
  }
}
