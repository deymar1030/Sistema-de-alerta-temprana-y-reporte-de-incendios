import AlertaRepository from "../../../../application/alerta/repositories/alerta.repository.js";

function toNumber(value) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function formatDate(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function formatTime(value) {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

function mapAlertaBase(alerta) {
  return {
    id_alerta: Number(alerta.id_alerta),
    fecha: formatDate(alerta.fecha),
    hora: formatTime(alerta.hora),
    estado: alerta.estado,
    puntaje: toNumber(alerta.puntaje),
    clasificacion: alerta.clasificacion,
    fecha_confirmacion: alerta.fecha_confirmacion,
    fecha_cierre: alerta.fecha_cierre,
  };
}

function mapEnvio(envio) {
  return {
    id_alerta: Number(envio.id_alerta),
    id_institucion: Number(envio.id_institucion),
    estado: envio.estado,
    fecha_envio: envio.fecha_envio,
    fecha_actualizacion: envio.fecha_actualizacion,
  };
}

export default class PrismaAlertaRepository extends AlertaRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async findAll(filters = {}) {
    const where = {};

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.clasificacion) {
      where.clasificacion = filters.clasificacion;
    }

    if (filters.desde || filters.hasta) {
      where.fecha = {};

      if (filters.desde) {
        where.fecha.gte = new Date(`${filters.desde}T00:00:00.000Z`);
      }

      if (filters.hasta) {
        where.fecha.lte = new Date(`${filters.hasta}T00:00:00.000Z`);
      }
    }

    if (filters.id_institucion) {
      where.envia = {
        some: {
          id_institucion: BigInt(filters.id_institucion),
        },
      };
    }

    if (filters.id_zona) {
      where.lectura = {
        some: {
          sensor: {
            predio: {
              id_zona: BigInt(filters.id_zona),
            },
          },
        },
      };
    }

    const alertas = await this.prisma.alerta.findMany({
      where,
      orderBy: [
        { fecha: "desc" },
        { hora: "desc" },
      ],
    });

    return alertas.map(mapAlertaBase);
  }

  async findById(id) {
    const alerta = await this.prisma.alerta.findUnique({
      where: {
        id_alerta: BigInt(id),
      },
      include: {
        lectura: {
          include: {
            sensor: {
              include: {
                predio: true,
              },
            },
          },
          orderBy: {
            fecha_hora: "asc",
          },
        },
        envia: {
          include: {
            institucion: true,
          },
        },
        genera_ru: {
          include: {
            reporte_u: true,
          },
        },
      },
    });

    if (!alerta) {
      return null;
    }

    const predioEncontrado =
      alerta.lectura.find((item) => item.sensor?.predio)?.sensor
        ?.predio ?? null;

    const predio = predioEncontrado
      ? {
          id_predio: Number(predioEncontrado.id_predio),
          nombre: predioEncontrado.nombre,
          tipo_predio: predioEncontrado.tipo_predio,
          latitud: toNumber(predioEncontrado.latitud),
          longitud: toNumber(predioEncontrado.longitud),
          irp: toNumber(predioEncontrado.irp),
        }
      : null;

    const lecturas = alerta.lectura.map((item) => ({
      id_lectura: Number(item.id_lectura),
      id_sensor: Number(item.id_sensor),
      valor: toNumber(item.valor),
      fecha_hora: item.fecha_hora,
      estado_lectura: item.estado_lectura,
      tipo_variable: item.tipo_variable,
    }));

    const instituciones_notificadas = alerta.envia.map((item) => ({
      id_institucion: Number(item.id_institucion),
      nombre: item.institucion.nombre,
      estado: item.estado,
      fecha_envio: item.fecha_envio,
      fecha_actualizacion: item.fecha_actualizacion,
    }));

    const reporte = alerta.genera_ru[0]?.reporte_u ?? null;

    const reporte_origen = reporte
      ? {
          id_reporte_u: Number(reporte.id_reporte_u),
          id_usuario: Number(reporte.id_usuario),
          descripcion: reporte.descripcion,
          tipo: reporte.tipo,
          nivel_prioridad: reporte.nivel_prioridad,
          estado: reporte.estado,
          fecha_envio: reporte.fecha_envio,
          latitud: toNumber(reporte.latitud),
          longitud: toNumber(reporte.longitud),
          indicador: reporte.indicador,
          foto_url: reporte.foto_url,
        }
      : null;

    return {
      ...mapAlertaBase(alerta),
      predio,
      lecturas,
      instituciones_notificadas,
      reporte_origen,
    };
  }

  async findActive() {
    const alertas = await this.prisma.alerta.findMany({
      where: {
        estado: {
          in: [
            "EN_EVALUACION",
            "CONFIRMADA",
            "ATENDIDA",
          ],
        },
      },
      orderBy: [
        { fecha: "desc" },
        { hora: "desc" },
      ],
    });

    return alertas.map(mapAlertaBase);
  }

  async findEnvio(id_alerta, id_institucion) {
    const envio = await this.prisma.envia.findUnique({
      where: {
        id_alerta_id_institucion: {
          id_alerta: BigInt(id_alerta),
          id_institucion: BigInt(id_institucion),
        },
      },
    });

    if (!envio) {
      return null;
    }

    return mapEnvio(envio);
  }

  async updateEnvioEstado(
    id_alerta,
    id_institucion,
    estado
  ) {
    const envio = await this.prisma.envia.update({
      where: {
        id_alerta_id_institucion: {
          id_alerta: BigInt(id_alerta),
          id_institucion: BigInt(id_institucion),
        },
      },
      data: {
        estado,
        fecha_actualizacion: new Date(),
      },
    });

    return mapEnvio(envio);
  }
}