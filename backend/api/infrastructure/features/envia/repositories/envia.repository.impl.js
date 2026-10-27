import EnviaRepository from "../../../../application/envia/repositories/envia.repository.js";

export default class PrismaEnviaRepository extends EnviaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByIds(id_alerta, id_institucion) {
    return await this.prisma.envia.findUnique({
      where: { id_alerta_id_institucion: { id_alerta, id_institucion } },
    });
  }

  async updateEstado(id_alerta, id_institucion, estado) {
    return this.prisma.$transaction(async (db) => {
      const origen = await db.lectura.findFirst({ where: { id_alerta: BigInt(id_alerta) }, select: { sensor: { select: { id_predio: true } } } });
      if (origen) await db.$queryRaw`SELECT id_predio FROM predio WHERE id_predio = ${origen.sensor.id_predio} FOR UPDATE`;
      await db.$queryRaw`SELECT id_alerta FROM alerta WHERE id_alerta = ${BigInt(id_alerta)} FOR UPDATE`;
      const where = { id_alerta_id_institucion: { id_alerta: BigInt(id_alerta), id_institucion: BigInt(id_institucion) } };
      const actual = await db.envia.findUnique({ where });
      if (!actual) throw new Error('Envio no encontrado');
      if (actual.estado === estado) return actual;
      const siguientes = { ENVIADA: ['RECIBIDA', 'ATENDIDA'], RECIBIDA: ['ATENDIDA'], ATENDIDA: ['CERRADA'], CERRADA: [] };
      if (!siguientes[actual.estado]?.includes(estado)) throw new Error(`Transicion no permitida: ${actual.estado} a ${estado}`);
      const ahora = new Date();
      const envio = await db.envia.update({ where, data: { estado, fecha_actualizacion: ahora } });
      let alerta_actualizada = null;
      if (estado === 'ATENDIDA') {
        await db.alerta.updateMany({ where: { id_alerta: BigInt(id_alerta), estado: 'CONFIRMADA' }, data: { estado: 'ATENDIDA' } });
        alerta_actualizada = await db.alerta.findUnique({ where: { id_alerta: BigInt(id_alerta) } });
      } else if (estado === 'CERRADA' && await db.envia.count({ where: { id_alerta: BigInt(id_alerta), estado: { not: 'CERRADA' } } }) === 0) {
        alerta_actualizada = await db.alerta.update({ where: { id_alerta: BigInt(id_alerta) }, data: { estado: 'CERRADA', fecha_cierre: ahora } });
      }
      return { ...envio, alerta_actualizada };
    });
  }
}
