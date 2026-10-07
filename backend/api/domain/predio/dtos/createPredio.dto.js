const TIPOS_PREDIO = ["VIVIENDA", "EDIFICIO", "MERCADO"];

export class CreatePredioDTO {
  constructor({
    id_zona,
    id_motordet,
    tipo_predio,
    nombre,
    direccion,
    latitud,
    longitud,
    fecha_evaluacion = null,
    estado_electrico = null,
    estado_gas = null,
    fuentes_calor = null,
    carga_combustible = null,
    material_construccion = null,
    ocupacion = null,
    nivel_proteccion = null,
  }) {
    this.id_zona = id_zona;
    this.id_motordet = id_motordet;
    this.tipo_predio = tipo_predio;
    this.nombre = nombre;
    this.direccion = direccion;
    this.latitud = latitud;
    this.longitud = longitud;
    this.fecha_evaluacion = fecha_evaluacion;
    this.estado_electrico = estado_electrico;
    this.estado_gas = estado_gas;
    this.fuentes_calor = fuentes_calor;
    this.carga_combustible = carga_combustible;
    this.material_construccion = material_construccion;
    this.ocupacion = ocupacion;
    this.nivel_proteccion = nivel_proteccion;
  }

  static validate({ id_zona, id_motordet, tipo_predio, nombre, direccion, latitud, longitud }) {
    const errors = [];

    if (!id_zona) errors.push("Missing id_zona");
    if (!id_motordet) errors.push("Missing id_motordet");
    if (!tipo_predio) errors.push("Missing tipo_predio");
    else if (!TIPOS_PREDIO.includes(tipo_predio)) errors.push(`tipo_predio must be one of: ${TIPOS_PREDIO.join(", ")}`);
    if (!nombre) errors.push("Missing nombre");
    if (!direccion) errors.push("Missing direccion");
    if (latitud === undefined || latitud === null) errors.push("Missing latitud");
    if (longitud === undefined || longitud === null) errors.push("Missing longitud");

    return errors;
  }
}
