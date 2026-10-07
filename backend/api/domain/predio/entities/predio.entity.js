export class PredioEntity {
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
  }
}
