import RecepcionaRepository from "../../../../application/recepciona/repositories/recepciona.repository.js";

const ALERTA_CERRADA = ["CERRADA", "DESCARTADA"];

export default class PrismaRecepcionaRepository extends RecepcionaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findAsignacionesActivas(idsUsuarios) {
    if (!idsUsuarios.length) return [];
    return await this.prisma.recepciona.findMany({
      where: {
        id_usuario: { in: idsUsuarios.map(BigInt) },
        estado: "ASIGNADO",
        alerta: { estado: { notIn: ALERTA_CERRADA } },
      },
      select: { id_usuario: true, id_alerta: true },
    });
  }

  // Para que el OPERATIVO vea "a que alertas me asignaron", con la alerta
  // completa (igual include que findMapa, para resolver ubicacion).
  async findAsignacionesActivasConAlerta(id_usuario) {
    return await this.prisma.recepciona.findMany({
      where: { id_usuario: BigInt(id_usuario), estado: "ASIGNADO" },
      orderBy: { fecha_asignacion: "desc" },
      include: {
        alerta: {
          include: {
            lectura: { take: 1, include: { sensor: { include: { predio: true } } } },
            genera_ru: { take: 1, include: { reporte_u: true } },
          },
        },
      },
    });
  }

  async asignar(id_alerta, idsUsuarios) {
    const ahora = new Date();
    return await this.prisma.$transaction(
      idsUsuarios.map((id_usuario) =>
        this.prisma.recepciona.upsert({
          where: { id_usuario_id_alerta: { id_usuario: BigInt(id_usuario), id_alerta: BigInt(id_alerta) } },
          create: { id_usuario: BigInt(id_usuario), id_alerta: BigInt(id_alerta), estado: "ASIGNADO", fecha_asignacion: ahora },
          update: { estado: "ASIGNADO", fecha_asignacion: ahora, fecha_liberacion: null },
        })
      )
    );
  }
}
