export class ResponseUsuarioDTO {
  constructor({
    id_usuario,
    id_rol,
    id_institucion,
    nombre,
    telefono,
    multiF_S,
    multiF_A,
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
    this.correo = correo;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
  }

  static fromEntity(usuario) {
    return new ResponseUsuarioDTO({
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      id_institucion: usuario.id_institucion,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      multiF_S: usuario.multiF_S,
      multiF_A: usuario.multiF_A,
      correo: usuario.correo,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
    });
  }
}
