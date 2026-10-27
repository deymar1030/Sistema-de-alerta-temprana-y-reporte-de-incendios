import InformeAtencionRepository from "../../../../application/informeAtencion/repositories/informeAtencion.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

function parseHora(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(`1970-01-01T${value}Z`);
}

function parseFecha(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

function campos(informeData) {
  return {
    id_alerta: informeData.id_alerta,
    id_institucion: informeData.id_institucion,
    id_usuario: informeData.id_usuario,
    estado: informeData.estado,
    fecha_incidente: parseFecha(informeData.fecha_incidente),
    hora_recepcion: parseHora(informeData.hora_recepcion),
    hora_salida: parseHora(informeData.hora_salida),
    hora_llegada: parseHora(informeData.hora_llegada),
    hora_control: parseHora(informeData.hora_control),
    hora_finalizacion: parseHora(informeData.hora_finalizacion),
    personal: informeData.personal,
    vehiculos: informeData.vehiculos,
    personas_afectadas: informeData.personas_afectadas,
    personas_evacuadas: informeData.personas_evacuadas,
    heridos: informeData.heridos,
    fallecidos: informeData.fallecidos,
    danos_materiales: informeData.danos_materiales,
    causa: informeData.causa,
    acciones: informeData.acciones,
    observaciones: informeData.observaciones,
    recomendaciones: informeData.recomendaciones,
  };
}

export default class PrismaInformeAtencionRepository extends InformeAtencionRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(informeData) {
    return await this.prisma.informe_atencion.create({ data: limpiar(campos(informeData)) });
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.id_institucion) where.id_institucion = Number(filters.id_institucion);
    if (filters.id_alerta) where.id_alerta = Number(filters.id_alerta);
    if (filters.estado) where.estado = filters.estado;

    return await this.prisma.informe_atencion.findMany({
      where,
      orderBy: { id_informe_atencion: "desc" },
    });
  }

  async findById(id) {
    return await this.prisma.informe_atencion.findUnique({ where: { id_informe_atencion: id } });
  }

  async update(id, informeData) {
    return await this.prisma.informe_atencion.update({
      where: { id_informe_atencion: id },
      data: limpiar(campos(informeData)),
    });
  }
}
