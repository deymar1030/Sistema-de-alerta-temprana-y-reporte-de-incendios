import SesionRepository from "../../../../application/sesion/repositories/sesion.repository.js";

// Campos del usuario que pueden salir de la capa de datos: nunca la contrasena.
const USUARIO_PUBLICO = {
  id_usuario: true,
  id_rol: true,
  id_institucion: true,
  nombre: true,
  telefono: true,
  multiF_S: true,
  multiF_A: true,
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
        dispositivo: sesionData.dispositivo,
        ip_origen: sesionData.ip_origen,
        creada_en: sesionData.creada_en,
        ultima_actividad: sesionData.ultima_actividad,
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

  async findActivasByUsuario(id_usuario, { ahora, limiteInactividad }) {
    return await this.prisma.sesion.findMany({
      where: {
        id_usuario,
        revocada_en: null,
        expira_en: { gt: ahora },
        ultima_actividad: { gt: limiteInactividad },
      },
      orderBy: { creada_en: "desc" },
    });
  }

  async touch(id_sesion, fecha) {
    await this.prisma.sesion.update({
      where: { id_sesion },
      data: { ultima_actividad: fecha },
    });
  }

  async revoke(id_sesion, fecha) {
    await this.prisma.sesion.update({
      where: { id_sesion },
      data: { revocada_en: fecha },
    });
  }

  async purgeAntiguas(id_usuario, limite) {
    await this.prisma.sesion.deleteMany({
      where: {
        id_usuario,
        OR: [{ expira_en: { lt: limite } }, { revocada_en: { lt: limite } }],
      },
    });
  }
}
