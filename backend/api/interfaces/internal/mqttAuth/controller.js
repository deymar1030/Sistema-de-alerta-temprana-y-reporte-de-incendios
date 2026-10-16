export class MqttAuthController {
  constructor({ verificarCredencialPredioUseCase, verificarPublicacionSensorUseCase }) {
    this.verificarCredencialPredioUseCase = verificarCredencialPredioUseCase;
    this.verificarPublicacionSensorUseCase = verificarPublicacionSensorUseCase;
  }

  auth = async (req, res) => {
    try {
      const ok = await this.verificarCredencialPredioUseCase.execute({
        username: req.body.username,
        password: req.body.password,
      });
      res.json({ ok });
    } catch (error) {
      console.error("[mqtt-auth] error en auth:", error.message);
      res.json({ ok: false });
    }
  };

  acl = async (req, res) => {
    try {
      const ok = await this.verificarPublicacionSensorUseCase.execute({
        username: req.body.username,
        topic: req.body.topic,
        acc: req.body.acc,
      });
      res.json({ ok });
    } catch (error) {
      console.error("[mqtt-auth] error en acl:", error.message);
      res.json({ ok: false });
    }
  };
}
