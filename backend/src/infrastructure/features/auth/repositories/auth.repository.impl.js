import AuthRepository from "../../../../application/auth/repositories/auth.repository.js";

export default class PrismaAuthRepository extends AuthRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findByCorreo(correo) {
    return await this.prisma.usuario.findFirst({
      where: { correo: { equals: correo, mode: "insensitive" } },
    });
  }

  async incrementarIntentosFallidos(id_usuario) {
    const usuario = await this.prisma.usuario.update({
      where: { id_usuario },
      data: { intentos_fallidos: { increment: 1 } },
      select: { intentos_fallidos: true },
    });

    return usuario.intentos_fallidos;
  }

  async bloquearHasta(id_usuario, fecha) {
    await this.prisma.usuario.update({
      where: { id_usuario },
      data: { bloqueado_hasta: fecha, intentos_fallidos: 0 },
    });
  }

  async limpiarIntentos(id_usuario) {
    await this.prisma.usuario.update({
      where: { id_usuario },
      data: { intentos_fallidos: 0, bloqueado_hasta: null },
    });
  }
}
