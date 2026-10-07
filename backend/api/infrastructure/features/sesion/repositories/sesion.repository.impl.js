import SesionRepository from "../../../../application/sesion/repositories/sesion.repository.js";

const USUARIO_PUBLICO = {
  id_usuario: true,
  id_rol: true,
  id_institucion: true,
  nombre: true,
  telefono: true,
  correo: true,
  primer_apellido: true,
  segundo_apellido: true,
};

export default class PrismaSesionRepository extends SesionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(sesionData) {
    return await this.prisma.sesion.create({
      data: {
        id_usuario: sesionData.id_usuario,
        token_hash: sesionData.token_hash,
        expira_en: sesionData.expira_en,
      },
    });
  }

  async findByTokenHash(tokenHash) {
    return await this.prisma.sesion.findUnique({
      where: { token_hash: tokenHash },
      include: { usuario: { select: USUARIO_PUBLICO } },
    });
  }

  async findById(id_sesion) {
    return await this.prisma.sesion.findUnique({ where: { id_sesion } });
  }

  async findActivasByUsuario(id_usuario, ahora) {
    return await this.prisma.sesion.findMany({
      where: { id_usuario, expira_en: { gt: ahora } },
      orderBy: { id_sesion: "desc" },
    });
  }

  async revoke(id_sesion) {
    await this.prisma.sesion.delete({ where: { id_sesion } });
  }

  async purgeAntiguas(id_usuario, limite) {
    await this.prisma.sesion.deleteMany({
      where: { id_usuario, expira_en: { lt: limite } },
    });
  }
}
