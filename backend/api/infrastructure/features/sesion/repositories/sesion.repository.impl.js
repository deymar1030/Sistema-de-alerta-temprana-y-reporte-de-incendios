import SesionRepository from "../../../../application/sesion/repositories/sesion.repository.js";

// rol.nombre_rol e institucion.categoria viajan junto a id_rol/id_institucion
// para que requireRole()/requireCategoriaInstitucion() puedan autorizar sin
// una consulta aparte (ver requireAuth.middleware.js).
const USUARIO_PUBLICO = {
  estado: true,
  fecha_eliminacion: true,
  bloqueado_hasta: true,
  mfa_secreto: true,
  mfa_habilitado: true,
  id_usuario: true,
  id_rol: true,
  id_institucion: true,
  nombre: true,
  telefono: true,
  correo: true,
  primer_apellido: true,
  segundo_apellido: true,
  rol: { select: { nombre_rol: true } },
  institucion: { select: { categoria: true, disponibilidad_operativa: true } },
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
        mfa_pendiente: sesionData.mfa_pendiente,
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

  // Se dispara al bloquear la cuenta por intentos fallidos: el bloqueo es de
  // toda la cuenta, no solo de los intentos de login nuevos (ver authenticate.useCase.js).
  async revokeAllByUsuario(id_usuario) {
    await this.prisma.sesion.deleteMany({ where: { id_usuario } });
  }

  async confirmarMfa(id_sesion, expira_en) {
    await this.prisma.sesion.update({
      where: { id_sesion },
      data: { mfa_pendiente: false, expira_en },
    });
  }
}
