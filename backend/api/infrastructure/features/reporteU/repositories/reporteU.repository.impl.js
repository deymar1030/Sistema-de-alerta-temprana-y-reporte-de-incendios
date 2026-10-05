import ReporteURepository from "../../../../application/reporteU/repositories/reporteU.repository.js";

export default class PrismaReporteURepository extends ReporteURepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(reporteUData) {
    return await this.prisma.reporte_u.create({
      data: {
        id_usuario: Number(reporteUData.id_usuario),
        descripcion: reporteUData.descripcion,
        tipo: reporteUData.tipo,
        nivel_prioridad: reporteUData.nivel_prioridad,
        estado: reporteUData.estado,
        latitud: reporteUData.latitud,
        longitud: reporteUData.longitud,
        indicador: reporteUData.indicador,
        foto_url: reporteUData.foto_url,
      },
    });
  }

  async findById(id) {
    return await this.prisma.reporte_u.findUnique({
      where: { id_reporte_u: Number(id) },
    });
  }

  async findAlertaVinculada(id_reporte_u) {
    const vinculo = await this.prisma.generaru.findFirst({
      where: { id_reporte_u: Number(id_reporte_u) },
      include: { alerta: true },
    });

    if (!vinculo) return null;

    return { id_alerta: vinculo.alerta.id_alerta, estado: vinculo.alerta.estado };
  }

  async findAll(filters = {}) {
    const { id_usuario, nivel_prioridad, estado, desde, hasta } = filters;

    const where = {};
    if (id_usuario) where.id_usuario = Number(id_usuario);
    if (nivel_prioridad) where.nivel_prioridad = nivel_prioridad;
    if (estado) where.estado = estado;
    if (desde || hasta) {
      where.fecha_envio = {};
      if (desde) where.fecha_envio.gte = new Date(desde);
      if (hasta) where.fecha_envio.lte = new Date(hasta);
    }

    return await this.prisma.reporte_u.findMany({
      where,
      orderBy: { fecha_envio: "desc" },
    });
  }

  async updateEstado(id, estado) {
    return await this.prisma.reporte_u.update({
      where: { id_reporte_u: Number(id) },
      data: { estado },
    });
  }

  async vincularAlerta(id, id_alerta) {
    await this.prisma.generaru.create({
      data: { id_reporte_u: Number(id), id_alerta: Number(id_alerta) },
    });

    return { id_alerta: Number(id_alerta), id_reporte_u: Number(id) };
  }
}
