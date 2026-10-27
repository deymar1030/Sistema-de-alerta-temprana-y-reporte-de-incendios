import RolRepository from "../../../../application/rol/repositories/rol.repository.js";

export default class PrismaRolRepository extends RolRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findOrCreateByNombre(nombre_rol) {
    return (
      (await this.prisma.rol.findUnique({ where: { nombre_rol } })) ??
      (await this.prisma.rol.create({ data: { nombre_rol } }))
    );
  }
}
