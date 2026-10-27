export class ResponseInstitucionDTO {
  constructor({
    id_institucion,
    categoria,
    detalle,
    nombre,
    razon_social,
    direccion,
    telefono_ins,
    latitud,
    longitud,
    estado,
    disponibilidad_operativa,
  }) {
    this.id_institucion = id_institucion;
    this.categoria = categoria;
    this.detalle = detalle;
    this.nombre = nombre;
    this.razon_social = razon_social;
    this.direccion = direccion;
    this.telefono_ins = telefono_ins;
    this.latitud = latitud;
    this.longitud = longitud;
    this.estado = estado;
    this.disponibilidad_operativa = disponibilidad_operativa;
  }

  static fromEntity(institucion) {
    return new ResponseInstitucionDTO({
      id_institucion: institucion.id_institucion,
      categoria: institucion.categoria,
      detalle: institucion.detalle,
      nombre: institucion.nombre,
      razon_social: institucion.razon_social,
      direccion: institucion.direccion,
      telefono_ins: institucion.telefono_ins,
      latitud: institucion.latitud === null || institucion.latitud === undefined ? null : Number(institucion.latitud),
      longitud:
        institucion.longitud === null || institucion.longitud === undefined ? null : Number(institucion.longitud),
      estado: institucion.estado,
      disponibilidad_operativa: institucion.disponibilidad_operativa,
    });
  }
}
