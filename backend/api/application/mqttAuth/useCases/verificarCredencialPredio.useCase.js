import { createHash, timingSafeEqual } from "node:crypto";
import { Hash } from "../../../config/hash.js";

const USERNAME_PATTERN = /^predio-([1-9]\d{0,18})$/;
const DUMMY_HASH = Hash.hash("contrasena-de-relleno-no-valida");

function compararSeguro(a, b) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export default class VerificarCredencialPredioUseCase {
  constructor(predioRepository, backend = { username: "", password: "" }) {
    this.predioRepository = predioRepository;
    this.backend = backend;
  }

  async execute({ username, password }) {
    if (this.backend.username && this.backend.password && username === this.backend.username) {
      return typeof password === "string" && compararSeguro(password, this.backend.password);
    }

    const match = typeof username === "string" ? USERNAME_PATTERN.exec(username) : null;
    if (!match || typeof password !== "string") {
      await Hash.compare(String(password || ""), await DUMMY_HASH);
      return false;
    }

    const predio = await this.predioRepository.findById(match[1]);
    const hashGuardado = predio?.contrasena_mqtt || (await DUMMY_HASH);
    const esValida = (await Hash.compare(password, hashGuardado)) && Boolean(predio?.contrasena_mqtt);

    return esValida;
  }
}
