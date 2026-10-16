import ZonaGeograficaRepository from "../../../../application/zonaGeografica/repositories/zonaGeografica.repository.js";

export default class PrismaZonaGeograficaRepository extends ZonaGeograficaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(zonaGeograficaData) {
    return await this.prisma.zona_geografica.create({
      data: {
        nombre: zonaGeograficaData.nombre,
        departamento: zonaGeograficaData.departamento,
        municipio: zonaGeograficaData.municipio,
        descripcion: zonaGeograficaData.descripcion,
        estado: zonaGeograficaData.estado,
        densidad_poblacional: zonaGeograficaData.densidad_poblacional,
      },
    });
  }

  async findAll() {
    return await this.prisma.zona_geografica.findMany({
      orderBy: { id_zona: "asc" },
    });
  }

  async findById(id) {
    return await this.prisma.zona_geografica.findUnique({
      where: { id_zona: Number(id) },
    });
  }

  async update(id, zonaGeograficaData) {
    return await this.prisma.zona_geografica.update({
      where: { id_zona: Number(id) },
      data: {
        nombre: zonaGeograficaData.nombre,
        departamento: zonaGeograficaData.departamento,
        municipio: zonaGeograficaData.municipio,
        descripcion: zonaGeograficaData.descripcion,
        estado: zonaGeograficaData.estado,
        densidad_poblacional: zonaGeograficaData.densidad_poblacional,
      },
    });
  }

  async delete(id) {
    // Baja logica: predio.id_zona referencia esta fila con onDelete Restrict,
    // asi que borrarla de verdad fallaria en cuanto tenga predios asociados.
    return await this.prisma.zona_geografica.update({
      where: { id_zona: Number(id) },
      data: { estado: false },
    });
  }
}
