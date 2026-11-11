import { generateSecret, generateURI, verify } from "otplib";

const EMISOR = "Alerta Temprana Incendios";

export class Totp {
  static generarSecreto() {
    return generateSecret();
  }

  static generarUri(secreto, correo) {
    return generateURI({ issuer: EMISOR, label: correo, secret: secreto });
  }

  static async verificar(codigo, secreto) {
    if (!codigo || !secreto) return false;
    try {
      const resultado = await verify({ secret: secreto, token: String(codigo) });
      return Boolean(resultado?.valid);
    } catch {
      return false;
    }
  }
}
