import { ResponseEnvioDTO } from "../../envia/dtos/responseEnvia.dto.js";
import { agruparPorInstitucion } from "../../recepciona/agruparPorInstitucion.js";
import { fechaHoraBolivia } from "../../shared/zonaHoraria.js";

// alerta.fecha / alerta.hora se guardan en UTC (la fecha y la hora del
// instante de apertura). Se devuelven en hora de Bolivia: si no, la alerta se
// mostraba 4 horas adelantada y, de noche, con la fecha del dia siguiente.
function fechaHoraAlerta(alerta) {
  if (!alerta.fecha || !alerta.hora) return { fecha: null, hora: null };
  const fecha = new Date(alerta.fecha), hora = new Date(alerta.hora);
  if (Number.isNaN(+fecha) || Number.isNaN(+hora)) return { fecha: null, hora: null };
  return fechaHoraBolivia(new Date(`${fecha.toISOString().slice(0, 10)}T${hora.toISOString().slice(11, 23)}Z`));
}

// Si el repositorio incluyo `envia` filtrado por id_institucion (ver
// includeMiEnvio en alerta.repository.impl.js), esta es la fila de ESA
// institucion: su propio ENVIADA/RECIBIDA/ATENDIDA/CERRADA, distinto del
// `estado` de la alerta (compartido por todas las instituciones notificadas).
// null cuando no se filtro por institucion o esa institucion no fue notificada.
function miEnvio(alerta) {
  const envio = alerta.envia?.[0];
  return envio ? ResponseEnvioDTO.fromEntity(envio) : null;
}

export class ResponseAlertaDTO {
  constructor({ id_alerta, fecha, hora, estado, puntaje, clasificacion, fecha_confirmacion, fecha_cierre, fecha_pico_critico, mi_envio, atendida_por }) {
    this.id_alerta = id_alerta;
    this.fecha = fecha;
    this.hora = hora;
    this.estado = estado;
    this.puntaje = puntaje;
    this.clasificacion = clasificacion;
    this.fecha_confirmacion = fecha_confirmacion;
    this.fecha_cierre = fecha_cierre;
    this.fecha_pico_critico = fecha_pico_critico;
    this.mi_envio = mi_envio;
    // Solo cuando la consulta incluyo `recepciona` (ver INCLUDE_ATENCION).
    if (atendida_por) {
      this.atendida_por = atendida_por;
      this.en_atencion = atendida_por.length > 0;
    }
  }

  static fromEntity(alerta) {
    return new ResponseAlertaDTO({
      atendida_por: Array.isArray(alerta.recepciona) ? agruparPorInstitucion(alerta.recepciona) : undefined,
      id_alerta: alerta.id_alerta,
      ...fechaHoraAlerta(alerta),
      estado: alerta.estado,
      puntaje: alerta.puntaje != null ? Number(alerta.puntaje) : null,
      clasificacion: alerta.clasificacion,
      fecha_confirmacion: alerta.fecha_confirmacion,
      fecha_cierre: alerta.fecha_cierre,
      fecha_pico_critico: alerta.fecha_pico_critico,
      mi_envio: miEnvio(alerta),
    });
  }
}

export class ResponseAlertaDetalleDTO extends ResponseAlertaDTO {
  constructor(data) {
    super(data);
    this.predio = data.predio;
    this.lecturas = data.lecturas;
    this.instituciones_notificadas = data.instituciones_notificadas;
    this.reporte_origen = data.reporte_origen;
  }

  static fromEntity(alerta, { predio, lecturas, instituciones_notificadas, reporte_origen }) {
    const base = ResponseAlertaDTO.fromEntity(alerta);
    return new ResponseAlertaDetalleDTO({ ...base, predio, lecturas, instituciones_notificadas, reporte_origen });
  }
}

function toNumber(v) {
  return v === null || v === undefined ? null : Number(v);
}

// Ubicaciones de una alerta para el mapa: la del predio del sensor que la
// genero (via lectura) y/o la del reporte ciudadano que la origino (via
// genera_ru), segun cual de los dos exista.
export class ResponseAlertaMapaDTO {
  constructor({ id_alerta, estado, clasificacion, fecha, hora, ubicaciones, mi_envio, atendida_por }) {
    this.id_alerta = id_alerta;
    this.estado = estado;
    this.clasificacion = clasificacion;
    this.fecha = fecha;
    this.hora = hora;
    this.ubicaciones = ubicaciones;
    this.mi_envio = mi_envio;
    // Instituciones con operativos ASIGNADO; vacio = nadie la esta atendiendo aun.
    this.atendida_por = atendida_por;
    this.en_atencion = atendida_por.length > 0;
  }

  static fromEntity(alerta) {
    const ubicaciones = [];

    const predio = alerta.lectura?.[0]?.sensor?.predio;
    if (predio?.latitud != null && predio?.longitud != null) {
      ubicaciones.push({
        origen: "PREDIO",
        id_predio: predio.id_predio,
        nombre: predio.nombre,
        latitud: toNumber(predio.latitud),
        longitud: toNumber(predio.longitud),
        irp: toNumber(predio.irp),
      });
    }

    const reporte = alerta.genera_ru?.[0]?.reporte_u;
    if (reporte?.latitud != null && reporte?.longitud != null) {
      ubicaciones.push({
        origen: "REPORTE",
        id_reporte_u: reporte.id_reporte_u,
        ubicacion_tipo: reporte.ubicacion_tipo,
        latitud: toNumber(reporte.latitud),
        longitud: toNumber(reporte.longitud),
      });
    }

    return new ResponseAlertaMapaDTO({
      id_alerta: alerta.id_alerta,
      estado: alerta.estado,
      clasificacion: alerta.clasificacion,
      ...fechaHoraAlerta(alerta),
      ubicaciones,
      mi_envio: miEnvio(alerta),
      atendida_por: agruparPorInstitucion(alerta.recepciona),
    });
  }
}
