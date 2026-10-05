export class UsuarioEntity {
  constructor({
    id_usuario,
    id_rol,
    id_institucion,
    nombre,
    telefono,
    multiF_S,
    multiF_A,
    contrasena,
    correo,
    primer_apellido,
    segundo_apellido,
  }) {
    this.id_usuario = id_usuario;
    this.id_rol = id_rol;
    this.id_institucion = id_institucion;
    this.nombre = nombre;
    this.telefono = telefono;
    this.multiF_S = multiF_S;
    this.multiF_A = multiF_A;
    this.contrasena = contrasena;
    this.correo = correo;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
  }
}
