import InstitucionRepository from "../../../../application/institucion/repositories/institucion.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export default class PrismaInstitucionRepository extends InstitucionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(institucionData) {
    return await this.prisma.institucion.create({
      data: limpiar({
        categoria: institucionData.categoria,
        detalle: institucionData.detalle,
        nombre: institucionData.nombre,
        razon_social: institucionData.razon_social,
        direccion: institucionData.direccion,
        telefono_ins: institucionData.telefono_ins,
        latitud: institucionData.latitud,
        longitud: institucionData.longitud,
      }),
    });
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.categoria) where.categoria = filters.categoria;

    return await this.prisma.institucion.findMany({
      where,
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
      data: limpiar({
        categoria: institucionData.categoria,
        detalle: institucionData.detalle,
        nombre: institucionData.nombre,
        razon_social: institucionData.razon_social,
        direccion: institucionData.direccion,
        telefono_ins: institucionData.telefono_ins,
        latitud: institucionData.latitud,
        longitud: institucionData.longitud,
        estado: institucionData.estado,
        disponibilidad_operativa: institucionData.disponibilidad_operativa,
      }),
    });
  }

  async delete(id) {
    return await this.prisma.institucion.delete({
      where: { id_institucion: Number(id) },
    });
  }

  async findJurisdicciones(id_institucion) {
    const vinculos = await this.prisma.cubre_jurisdiccion.findMany({
      where: { id_institucion: Number(id_institucion) },
      include: { zona_geografica: true },
    });

    return vinculos.map((v) => v.zona_geografica);
  }

  async addJurisdiccion(id_institucion, id_zona) {
    return await this.prisma.cubre_jurisdiccion.create({
      data: { id_institucion: Number(id_institucion), id_zona: Number(id_zona) },
    });
  }

  async removeJurisdiccion(id_institucion, id_zona) {
    await this.prisma.cubre_jurisdiccion.delete({
      where: {
        id_zona_id_institucion: { id_zona: Number(id_zona), id_institucion: Number(id_institucion) },
      },
    });
  }
}
