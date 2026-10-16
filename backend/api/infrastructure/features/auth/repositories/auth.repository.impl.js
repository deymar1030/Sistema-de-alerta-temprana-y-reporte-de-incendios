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
}
