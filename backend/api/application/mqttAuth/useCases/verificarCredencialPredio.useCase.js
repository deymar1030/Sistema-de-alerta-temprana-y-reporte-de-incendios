import { Hash } from "../../../config/hash.js";

const USERNAME_PATTERN = /^predio-([1-9]\d{0,18})$/;
const DUMMY_HASH = Hash.hash("contrasena-de-relleno-no-valida");

export default class VerificarCredencialPredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute({ username, password }) {
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
