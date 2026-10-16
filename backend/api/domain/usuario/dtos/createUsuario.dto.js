export class CreateUsuarioDTO {
  constructor({
    id_rol = null,
    id_institucion = null,
    nombre,
    telefono = null,
    contrasena,
    correo,
    primer_apellido = null,
    segundo_apellido = null,
  }) {
    this.id_rol = id_rol;
    this.id_institucion = id_institucion;
    this.nombre = nombre;
    this.telefono = telefono;
    this.contrasena = contrasena;
    this.correo = correo;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
  }

  static validate({ nombre, correo, contrasena }) {
    const errors = [];

    if (!nombre) errors.push("Missing nombre");
    if (!correo) errors.push("Missing correo");
    if (!contrasena) errors.push("Missing contrasena");

    return errors;
  }
}
