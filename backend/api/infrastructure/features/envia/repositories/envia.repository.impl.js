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
        // CERRADA ya no decide el cierre global aqui: la cierra el
        // informe_atencion de la institucion BOMBEROS que certifica el
        // control del incendio (ver informeAtencion.repository.impl.js#
        // cerrarAlertaPorInforme). Que todas las instituciones notificadas
        // cierren su envio solo indica que cada una termino su parte, no que
        // el incendio esta controlado.
        await db.alerta.updateMany({ where: { id_alerta: BigInt(id_alerta), estado: 'CONFIRMADA' }, data: { estado: 'ATENDIDA' } });
        alerta_actualizada = await db.alerta.findUnique({ where: { id_alerta: BigInt(id_alerta) } });
      } else if (estado === 'CERRADA') {
        // Esta institucion termino su parte en esta alerta: sus propios
        // operativos quedan libres para otra, aunque el incendio en si siga
        // sin certificarse controlado por Bomberos (eso es un cierre aparte,
        // independiente por institucion -- ver nota arriba).
        await db.recepciona.updateMany({
          where: { id_alerta: BigInt(id_alerta), estado: 'ASIGNADO', usuario: { id_institucion: BigInt(id_institucion) } },
          data: { estado: 'LIBERADO', fecha_liberacion: ahora },
        });
      }
      return { ...envio, alerta_actualizada };
    });
  }

  async actualizarRuta(id_alerta, id_institucion, { ruta_json, ruta_error }) {
    return this.prisma.envia.update({
      where: { id_alerta_id_institucion: { id_alerta: BigInt(id_alerta), id_institucion: BigInt(id_institucion) } },
      data: { ruta_json: ruta_json ?? null, ruta_error: ruta_error ?? null, ruta_calculada_en: new Date() },
    });
  }
}
