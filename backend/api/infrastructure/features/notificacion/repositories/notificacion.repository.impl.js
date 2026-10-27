import NotificacionRepository from "../../../../application/notificacion/repositories/notificacion.repository.js";

export default class PrismaNotificacionRepository extends NotificacionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  _toData(notificacionData) {
    return {
      id_usuario: Number(notificacionData.id_usuario),
      id_usuario_emisor: notificacionData.id_usuario_emisor ? Number(notificacionData.id_usuario_emisor) : null,
      id_alerta: notificacionData.id_alerta ? Number(notificacionData.id_alerta) : null,
      tipo: notificacionData.tipo,
      titulo: notificacionData.titulo,
      mensaje: notificacionData.mensaje,
    };
  }

  async create(notificacionData) {
    return await this.prisma.notificacion.create({ data: this._toData(notificacionData) });
  }

  async createMany(notificacionesData) {
    return await this.prisma.$transaction(
      notificacionesData.map((data) => this.prisma.notificacion.create({ data: this._toData(data) }))
    );
  }

  async findAllByUsuario(id_usuario, filters = {}) {
    const { leida, tipo } = filters;

    const where = { id_usuario: Number(id_usuario) };
    if (leida !== undefined) where.leida = leida === "true" || leida === true;
    if (tipo) where.tipo = tipo;

    return await this.prisma.notificacion.findMany({
      where,
      orderBy: { fecha_hora: "desc" },
    });
  }

  async findByIdForUsuario(id, id_usuario) {
    return await this.prisma.notificacion.findFirst({
      where: { id_notificacion: Number(id), id_usuario: Number(id_usuario) },
    });
  }

  async countNoLeidas(id_usuario) {
    return await this.prisma.notificacion.count({
      where: { id_usuario: Number(id_usuario), leida: false },
    });
  }

  async marcarLeida(id) {
    return await this.prisma.notificacion.update({
      where: { id_notificacion: Number(id) },
      data: { leida: true },
    });
  }

  async marcarTodasLeidas(id_usuario) {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { id_usuario: Number(id_usuario), leida: false },
      data: { leida: true },
    });

    return count;
  }
}
