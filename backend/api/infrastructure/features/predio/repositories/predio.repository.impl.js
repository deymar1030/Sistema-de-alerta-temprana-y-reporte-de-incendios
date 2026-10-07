import PredioRepository from "../../../../application/predio/repositories/predio.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export default class PrismaPredioRepository extends PredioRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(predioData) {
    return await this.prisma.predio.create({
      data: {
        id_zona: Number(predioData.id_zona),
        id_motordet: Number(predioData.id_motordet),
        tipo_predio: predioData.tipo_predio,
        nombre: predioData.nombre,
        direccion: predioData.direccion,
        latitud: predioData.latitud,
        longitud: predioData.longitud,
        fecha_evaluacion: predioData.fecha_evaluacion ? new Date(predioData.fecha_evaluacion) : null,
        irp: predioData.irp,
        estado_electrico: predioData.estado_electrico,
        estado_gas: predioData.estado_gas,
        fuentes_calor: predioData.fuentes_calor,
        carga_combustible: predioData.carga_combustible,
        material_construccion: predioData.material_construccion,
        ocupacion: predioData.ocupacion,
        nivel_proteccion: predioData.nivel_proteccion,
      },
    });
  }

  async findById(id) {
    return await this.prisma.predio.findUnique({
      where: { id_predio: Number(id) },
    });
  }

  async findSensores(id_predio) {
    return await this.prisma.sensor.findMany({
      where: { id_predio: Number(id_predio) },
      select: { id_sensor: true, nombre: true, tipo_sensor: true, estado: true },
    });
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.id_zona) where.id_zona = Number(filters.id_zona);
    if (filters.tipo_predio) where.tipo_predio = filters.tipo_predio;

    return await this.prisma.predio.findMany({
      where,
      orderBy: { id_predio: "asc" },
    });
  }

  async findMapa() {
    return await this.prisma.predio.findMany({
      orderBy: { id_predio: "asc" },
    });
  }

  async update(id, predioData) {
    const data = limpiar({
      id_zona: predioData.id_zona !== undefined ? Number(predioData.id_zona) : undefined,
      id_motordet: predioData.id_motordet !== undefined ? Number(predioData.id_motordet) : undefined,
      tipo_predio: predioData.tipo_predio,
      nombre: predioData.nombre,
      direccion: predioData.direccion,
      latitud: predioData.latitud,
      longitud: predioData.longitud,
      fecha_evaluacion: predioData.fecha_evaluacion !== undefined && predioData.fecha_evaluacion !== null
        ? new Date(predioData.fecha_evaluacion)
        : predioData.fecha_evaluacion,
      irp: predioData.irp,
      estado_electrico: predioData.estado_electrico,
      estado_gas: predioData.estado_gas,
      fuentes_calor: predioData.fuentes_calor,
      carga_combustible: predioData.carga_combustible,
      material_construccion: predioData.material_construccion,
      ocupacion: predioData.ocupacion,
      nivel_proteccion: predioData.nivel_proteccion,
    });

    return await this.prisma.predio.update({
      where: { id_predio: Number(id) },
      data,
    });
  }

  async delete(id) {
    return await this.prisma.predio.delete({
      where: { id_predio: Number(id) },
    });
  }
}
