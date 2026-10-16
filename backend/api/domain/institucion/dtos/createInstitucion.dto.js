const CATEGORIAS = ["BOMBEROS", "POLICIA", "DEFENSA_CIVIL", "RESCATE", "OTRA"];

export class CreateInstitucionDTO {
  constructor({
    categoria,
    detalle = null,
    nombre,
    razon_social = null,
    direccion = null,
    telefono_ins = null,
    latitud = null,
    longitud = null,
  }) {
    this.categoria = categoria;
    this.detalle = detalle;
    this.nombre = nombre;
    this.razon_social = razon_social;
    this.direccion = direccion;
    this.telefono_ins = telefono_ins;
    this.latitud = latitud;
    this.longitud = longitud;
  }

  static validate({ categoria, nombre, latitud, longitud }) {
    const errors = [];

    if (!categoria) errors.push("Missing categoria");
    else if (!CATEGORIAS.includes(categoria)) {
      errors.push(`categoria must be one of: ${CATEGORIAS.join(", ")}`);
    }
    if (!nombre) errors.push("Missing nombre");
    if (latitud != null && (latitud < -90 || latitud > 90)) errors.push("latitud must be between -90 and 90");
    if (longitud != null && (longitud < -180 || longitud > 180)) errors.push("longitud must be between -180 and 180");

    return errors;
  }
}
