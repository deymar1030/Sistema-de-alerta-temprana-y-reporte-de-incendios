const MAX_LENGTH = 128;

export class LoginDTO {
  constructor({ correo, contrasena }) {
    this.correo = correo;
    this.contrasena = contrasena;
  }

  static validate({ correo, contrasena } = {}) {
    const errors = [];

    if (typeof correo !== "string" || correo.trim() === "") errors.push("Missing correo");
    if (typeof contrasena !== "string" || contrasena === "") errors.push("Missing contrasena");
    if (typeof correo === "string" && correo.length > MAX_LENGTH) errors.push("correo too long");
    if (typeof contrasena === "string" && contrasena.length > MAX_LENGTH) {
      errors.push("contrasena too long");
    }

    return errors;
  }
}
