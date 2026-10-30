const USERNAME_PATTERN = /^predio-([1-9]\d{0,18})$/;
const TOPIC_PATTERN = /^incendios\/([1-9]\d{0,18})\/([1-9]\d{0,18})$/;
const TOPIC_FILTER_PATTERN = /^incendios\/(?:[1-9]\d{0,18}|\+)\/(?:[1-9]\d{0,18}|\+)$/;
const ACC_READ = 1;
const ACC_WRITE = 2;
const ACC_SUBSCRIBE = 4;

export default class VerificarPublicacionSensorUseCase {
  constructor(predioRepository, backendUsername = "") {
    this.predioRepository = predioRepository;
    this.backendUsername = backendUsername;
  }

  async execute({ username, topic, acc }) {
    const accNum = Number(acc);

    if (this.backendUsername && username === this.backendUsername) {
      return (
        (accNum === ACC_READ || accNum === ACC_SUBSCRIBE) &&
        typeof topic === "string" &&
        TOPIC_FILTER_PATTERN.test(topic)
      );
    }

    if (accNum !== ACC_WRITE) return false;

    const usuarioMatch = typeof username === "string" ? USERNAME_PATTERN.exec(username) : null;
    const topicMatch = typeof topic === "string" ? TOPIC_PATTERN.exec(topic) : null;
    if (!usuarioMatch || !topicMatch || usuarioMatch[1] !== topicMatch[1]) return false;

    const [, id_predio, id_sensor] = topicMatch;
    const sensores = await this.predioRepository.findSensores(id_predio);
    return sensores.some((s) => String(s.id_sensor) === id_sensor && s.estado === "ACTIVO");
  }
}
