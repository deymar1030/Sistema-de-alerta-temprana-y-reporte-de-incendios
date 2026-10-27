const USERNAME_PATTERN = /^predio-([1-9]\d{0,18})$/;
const TOPIC_PATTERN = /^incendios\/([1-9]\d{0,18})\/([1-9]\d{0,18})$/;
const ACC_WRITE = 2;

export default class VerificarPublicacionSensorUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute({ username, topic, acc }) {
    if (Number(acc) !== ACC_WRITE) return false;

    const usuarioMatch = typeof username === "string" ? USERNAME_PATTERN.exec(username) : null;
    const topicMatch = typeof topic === "string" ? TOPIC_PATTERN.exec(topic) : null;
    if (!usuarioMatch || !topicMatch || usuarioMatch[1] !== topicMatch[1]) return false;

    const [, id_predio, id_sensor] = topicMatch;
    const sensores = await this.predioRepository.findSensores(id_predio);
    return sensores.some((s) => String(s.id_sensor) === id_sensor && s.estado === "ACTIVO");
  }
}
