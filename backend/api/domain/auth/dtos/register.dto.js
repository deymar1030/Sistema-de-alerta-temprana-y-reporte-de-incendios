const MAX_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

export class RegisterDTO {
  constructor({ nombre, primer_apellido, segundo_apellido = null, telefono = null, correo, contrasena }) {
    this.nombre = nombre;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.telefono = telefono;
    this.correo = correo;
    this.contrasena = contrasena;
  }

  static validate({ nombre, primer_apellido, correo, contrasena } = {}) {
    const errors = [];

    if (typeof nombre !== "string" || nombre.trim() === "") errors.push("Missing nombre");
    if (typeof primer_apellido !== "string" || primer_apellido.trim() === "") {
      errors.push("Missing primer_apellido");
    }

    if (typeof correo !== "string" || correo.trim() === "") errors.push("Missing correo");
    else if (correo.length > MAX_LENGTH) errors.push("correo too long");

    if (typeof contrasena !== "string" || contrasena.length < MIN_PASSWORD_LENGTH) {
      errors.push(`contrasena must be at least ${MIN_PASSWORD_LENGTH} characters`);
    } else if (contrasena.length > MAX_LENGTH) {
      errors.push("contrasena too long");
    }

    return errors;
  }
}
