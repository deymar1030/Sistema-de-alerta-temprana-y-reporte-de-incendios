export class ResponseUsuarioDTO {
  constructor({
    id_usuario,
    id_rol,
    id_institucion,
    nombre,
    telefono,
    correo,
    primer_apellido,
    segundo_apellido,
    fecha_eliminacion,
    estado,
  }) {
    this.id_usuario = id_usuario;
    this.id_rol = id_rol;
    this.id_institucion = id_institucion;
    this.nombre = nombre;
    this.telefono = telefono;
    this.correo = correo;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.fecha_eliminacion = fecha_eliminacion;
    this.estado = estado;
  }

  static fromEntity(usuario) {
    return new ResponseUsuarioDTO({
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      id_institucion: usuario.id_institucion,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      correo: usuario.correo,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      fecha_eliminacion: usuario.fecha_eliminacion,
      estado: usuario.estado,
    });
  }
}
