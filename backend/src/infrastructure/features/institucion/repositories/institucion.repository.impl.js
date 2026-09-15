import InstitucionRepository from "../../../../application/institucion/repositories/institucion.repository.js";

export default class PrismaInstitucionRepository extends InstitucionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(institucionData) {
    return await this.prisma.institucion.create({
      data: {
        categoria: institucionData.categoria,
        detalle: institucionData.detalle,
        nombre: institucionData.nombre,
        razon_social: institucionData.razon_social,
        telefono_ins: institucionData.telefono_ins,
      },
    });
  }

  async findAll() {
    return await this.prisma.institucion.findMany({
      orderBy: { id_institucion: "asc" },
    });
  }

  async findById(id) {
    return await this.prisma.institucion.findUnique({
      where: { id_institucion: Number(id) },
    });
  }

  async update(id, institucionData) {
    return await this.prisma.institucion.update({
      where: { id_institucion: Number(id) },
      data: {
        categoria: institucionData.categoria,
        detalle: institucionData.detalle,
        nombre: institucionData.nombre,
        razon_social: institucionData.razon_social,
        telefono_ins: institucionData.telefono_ins,
      },
    });
  }

  async delete(id) {
    return await this.prisma.institucion.delete({
      where: { id_institucion: Number(id) },
    });
  }
}