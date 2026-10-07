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
    return await this.prisma.envia.update({
      where: { id_alerta_id_institucion: { id_alerta, id_institucion } },
      data: { estado, fecha_actualizacion: new Date() },
    });
  }
}
