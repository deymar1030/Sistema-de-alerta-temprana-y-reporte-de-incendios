export class ResponseInstitucionDTO {
  constructor({
    id_institucion,
    categoria,
    detalle,
    nombre,
    razon_social,
    telefono_ins,
  }) {
    this.id_institucion = id_institucion;
    this.categoria = categoria;
    this.detalle = detalle;
    this.nombre = nombre;
    this.razon_social = razon_social;
    this.telefono_ins = telefono_ins;
  }

  static fromEntity(institucion) {
    return new ResponseInstitucionDTO({
      id_institucion: institucion.id_institucion,
      categoria: institucion.categoria,
      detalle: institucion.detalle,
      nombre: institucion.nombre,
      razon_social: institucion.razon_social,
      telefono_ins: institucion.telefono_ins,
    });
  }
}