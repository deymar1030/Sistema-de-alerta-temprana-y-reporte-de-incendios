function toNumber(v) {
  return v === null || v === undefined ? null : Number(v);
}

export class ResponsePredioDTO {
  constructor({
    id_predio,
    id_zona,
    id_motordet,
    tipo_predio,
    nombre,
    direccion,
    latitud,
    longitud,
    fecha_evaluacion,
    irp,
    estado_electrico,
    estado_gas,
    fuentes_calor,
    carga_combustible,
    material_construccion,
    ocupacion,
    nivel_proteccion,
    sensores = undefined,
  }) {
    this.id_predio = id_predio;
    this.id_zona = id_zona;
    this.id_motordet = id_motordet;
    this.tipo_predio = tipo_predio;
    this.nombre = nombre;
    this.direccion = direccion;
    this.latitud = latitud;
    this.longitud = longitud;
    this.fecha_evaluacion = fecha_evaluacion;
    this.irp = irp;
    this.estado_electrico = estado_electrico;
    this.estado_gas = estado_gas;
    this.fuentes_calor = fuentes_calor;
    this.carga_combustible = carga_combustible;
    this.material_construccion = material_construccion;
    this.ocupacion = ocupacion;
    this.nivel_proteccion = nivel_proteccion;
    if (sensores !== undefined) this.sensores = sensores;
  }

  static fromEntity(predio, sensores = undefined) {
    return new ResponsePredioDTO({
      id_predio: predio.id_predio,
      id_zona: predio.id_zona,
      id_motordet: predio.id_motordet,
      tipo_predio: predio.tipo_predio,
      nombre: predio.nombre,
      direccion: predio.direccion,
      latitud: toNumber(predio.latitud),
      longitud: toNumber(predio.longitud),
      fecha_evaluacion: predio.fecha_evaluacion,
      irp: toNumber(predio.irp),
      estado_electrico: predio.estado_electrico,
      estado_gas: predio.estado_gas,
      fuentes_calor: predio.fuentes_calor,
      carga_combustible: predio.carga_combustible,
      material_construccion: predio.material_construccion,
      ocupacion: predio.ocupacion,
      nivel_proteccion: predio.nivel_proteccion,
      sensores,
    });
  }
}

export class ResponsePredioMapaDTO {
  constructor({ id_predio, nombre, tipo_predio, latitud, longitud, irp }) {
    this.id_predio = id_predio;
    this.nombre = nombre;
    this.tipo_predio = tipo_predio;
    this.latitud = latitud;
    this.longitud = longitud;
    this.irp = irp;
  }

  static fromEntity(predio) {
    return new ResponsePredioMapaDTO({
      id_predio: predio.id_predio,
      nombre: predio.nombre,
      tipo_predio: predio.tipo_predio,
      latitud: toNumber(predio.latitud),
      longitud: toNumber(predio.longitud),
      irp: toNumber(predio.irp),
    });
  }
}
