import { Validators } from "../../../config/validators.js";
import { DISPONIBILIDAD_OPERATIVA } from "./updateDisponibilidadInstitucion.dto.js";

const CATEGORIAS = ["BOMBEROS", "POLICIA", "DEFENSA_CIVIL", "RESCATE", "OTRA"];

export class UpdateInstitucionDTO {
  constructor(data) {
    Object.assign(this, data);
  }

  static validate(id, { categoria, latitud, longitud, disponibilidad_operativa }) {
    const errors = [];

    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (categoria !== undefined && !CATEGORIAS.includes(categoria)) {
      errors.push(`categoria must be one of: ${CATEGORIAS.join(", ")}`);
    }
    if (latitud != null && (latitud < -90 || latitud > 90)) errors.push("latitud must be between -90 and 90");
    if (longitud != null && (longitud < -180 || longitud > 180)) errors.push("longitud must be between -180 and 180");
    if (disponibilidad_operativa !== undefined && !DISPONIBILIDAD_OPERATIVA.includes(disponibilidad_operativa)) {
      errors.push(`disponibilidad_operativa must be one of: ${DISPONIBILIDAD_OPERATIVA.join(", ")}`);
    }

    return errors;
  }
}
