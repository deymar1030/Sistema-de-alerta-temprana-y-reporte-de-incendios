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
    // Baja logica: borrarla de verdad fallaria en cuanto tenga informes de
    // atencion asociados (Restrict), y antes de eso arrastraria en cascada
    // su historial de notificaciones (envia).
    return await this.prisma.institucion.update({
      where: { id_institucion: Number(id) },
      data: { estado: false },
    });
  }

}
