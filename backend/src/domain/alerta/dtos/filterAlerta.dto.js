import { Validators } from "../../../config/validators.js";

const ESTADOS_ALERTA = [
  "EN_EVALUACION",
  "CONFIRMADA",
  "DESCARTADA",
  "ATENDIDA",
  "CERRADA",
];

const CLASIFICACIONES_ALERTA = [
  "INCENDIO",
  "CLIMA",
  "FALLA_SENSOR",
  "SIN_EVIDENCIA",
];

export class FilterAlertaDTO {
  constructor({
    estado = null,
    clasificacion = null,
    id_zona = null,
    id_institucion = null,
    desde = null,
    hasta = null,
  } = {}) {
    this.estado = estado;
    this.clasificacion = clasificacion;
    this.id_zona = id_zona;
    this.id_institucion = id_institucion;
    this.desde = desde;
    this.hasta = hasta;
  }

  static validate({
    estado,
    clasificacion,
    id_zona,
    id_institucion,
    desde,
    hasta,
  } = {}) {
    const errors = [];

    if (estado && !ESTADOS_ALERTA.includes(estado)) {
      errors.push("Estado not valid");
    }

    if (
      clasificacion &&
      !CLASIFICACIONES_ALERTA.includes(clasificacion)
    ) {
      errors.push("Clasificacion not valid");
    }

    if (id_zona && !Validators.isValidId(id_zona)) {
      errors.push("id_zona not valid");
    }

    if (id_institucion && !Validators.isValidId(id_institucion)) {
      errors.push("id_institucion not valid");
    }

    if (desde && !/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      errors.push("desde not valid");
    }

    if (hasta && !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      errors.push("hasta not valid");
    }

    return errors;
  }
}