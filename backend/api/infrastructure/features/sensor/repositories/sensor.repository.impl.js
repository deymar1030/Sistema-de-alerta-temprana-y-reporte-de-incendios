import SensorRepository from "../../../../application/sensor/repositories/sensor.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export default class PrismaSensorRepository extends SensorRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(sensorData) {
    return await this.prisma.sensor.create({
      data: {
        id_predio: Number(sensorData.id_predio),
        nombre: sensorData.nombre,
        tipo_sensor: sensorData.tipo_sensor,
        unidad_medida: sensorData.unidad_medida,
        modelo: sensorData.modelo,
        fabricante: sensorData.fabricante,
        fecha_instalacion: sensorData.fecha_instalacion ? new Date(sensorData.fecha_instalacion) : null,
        estado: sensorData.estado,
        rango_min: sensorData.rango_min,
        rango_max: sensorData.rango_max,
      },
    });
  }

  async findById(id) {
    return await this.prisma.sensor.findUnique({
      where: { id_sensor: Number(id) },
    });
  }

  async findUltimaLectura(id_sensor) {
    const lectura = await this.prisma.lectura.findFirst({
      where: { id_sensor: Number(id_sensor) },
      orderBy: { fecha_hora: "desc" },
      select: { valor: true, fecha_hora: true },
    });

    if (!lectura) return null;

    return { valor: Number(lectura.valor), fecha_hora: lectura.fecha_hora };
  }

  async findPredio(id_predio) {
    const predio = await this.prisma.predio.findUnique({
      where: { id_predio: Number(id_predio) },
      select: { id_predio: true, nombre: true, latitud: true, longitud: true },
    });

    if (!predio) return null;

    return {
      id_predio: predio.id_predio,
      nombre: predio.nombre,
      latitud: Number(predio.latitud),
      longitud: Number(predio.longitud),
    };
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.id_predio) where.id_predio = Number(filters.id_predio);
    if (filters.tipo_sensor) where.tipo_sensor = filters.tipo_sensor;
    if (filters.estado) where.estado = filters.estado;

    return await this.prisma.sensor.findMany({
      where,
      orderBy: { id_sensor: "asc" },
    });
  }

  async findLecturas(id_sensor, filters = {}) {
    const where = { id_sensor: Number(id_sensor) };
    if (filters.desde || filters.hasta) {
      where.fecha_hora = {};
      if (filters.desde) where.fecha_hora.gte = new Date(filters.desde);
      if (filters.hasta) where.fecha_hora.lte = new Date(filters.hasta);
    }

    return await this.prisma.lectura.findMany({
      where,
      orderBy: { fecha_hora: "desc" },
      take: filters.limit ? Number(filters.limit) : undefined,
    });
  }

  async update(id, sensorData) {
    return await this.prisma.sensor.update({
      where: { id_sensor: Number(id) },
      data: limpiar({
        id_predio: sensorData.id_predio !== undefined ? Number(sensorData.id_predio) : undefined,
        nombre: sensorData.nombre,
        tipo_sensor: sensorData.tipo_sensor,
        unidad_medida: sensorData.unidad_medida,
        modelo: sensorData.modelo,
        fabricante: sensorData.fabricante,
        fecha_instalacion:
          sensorData.fecha_instalacion !== undefined && sensorData.fecha_instalacion !== null
            ? new Date(sensorData.fecha_instalacion)
            : sensorData.fecha_instalacion,
        estado: sensorData.estado,
        rango_min: sensorData.rango_min,
        rango_max: sensorData.rango_max,
      }),
    });
  }

  async delete(id) {
    return await this.prisma.sensor.delete({
      where: { id_sensor: Number(id) },
    });
  }
}
