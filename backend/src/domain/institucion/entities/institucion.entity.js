export class InstitucionEntity {
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
}