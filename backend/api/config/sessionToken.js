import { randomBytes, createHash } from "node:crypto";

export class SessionToken {
  // 256 bits aleatorios: es lo unico que viaja en la cookie.
  static generate() {
    return randomBytes(32).toString("base64url");
  }

  // En la base de datos solo se guarda el hash: si la BD se filtra, los
  // identificadores de sesion no se pueden usar.
  static hash(token) {
    return createHash("sha256").update(token).digest("hex");
  }
}
