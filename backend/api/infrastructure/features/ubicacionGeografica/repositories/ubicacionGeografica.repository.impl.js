import UbicacionGeograficaRepository from "../../../../application/ubicacionGeografica/repositories/ubicacionGeografica.repository.js";

export default class PrismaUbicacionGeograficaRepository extends UbicacionGeograficaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(entity) {
    return await this.prisma.ubicacion_geografica.create({
      data: {
        id_zona: entity.id_zona,
        id_motordet: entity.id_motordet ?? null,
        latitud: entity.latitud,
        longitud: entity.longitud,
        altitud: entity.altitud,
        poligono_geografico: entity.poligono_geografico,
      },
    });
  }

  async findById(id) {
    return await this.prisma.ubicacion_geografica.findUnique({
      where: { id_ubic_geo: Number(id) },
    });
  }

  async findAll() {
    return await this.prisma.ubicacion_geografica.findMany({
      orderBy: { id_ubic_geo: "asc" },
    });
  }

  async update(id, entity) {
    return await this.prisma.ubicacion_geografica.update({
      where: { id_ubic_geo: Number(id) },
      data: {
        id_zona: entity.id_zona,
        id_motordet: entity.id_motordet ?? null,
        latitud: entity.latitud,
        longitud: entity.longitud,
        altitud: entity.altitud,
        poligono_geografico: entity.poligono_geografico,
      },
    });
  }

  async delete(id) {
    return await this.prisma.ubicacion_geografica.delete({
      where: { id_ubic_geo: Number(id) },
    });
  }
}