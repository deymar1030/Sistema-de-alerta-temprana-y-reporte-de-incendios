export class InstitucionEntity {
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
}
