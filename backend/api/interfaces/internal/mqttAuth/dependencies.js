import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { envs } from "../../../config/envs.js";
import { MqttAuthController } from "./controller.js";
import PrismaPredioRepository from "../../../infrastructure/features/predio/repositories/predio.repository.impl.js";
import VerificarCredencialPredioUseCase from "../../../application/mqttAuth/useCases/verificarCredencialPredio.useCase.js";
import VerificarPublicacionSensorUseCase from "../../../application/mqttAuth/useCases/verificarPublicacionSensor.useCase.js";

export class MqttAuthDependencies {
  static createController() {
    const predioRepository = new PrismaPredioRepository(prisma);
    const backend = { username: envs.MQTT_USERNAME, password: envs.MQTT_PASSWORD };

    return new MqttAuthController({
      verificarCredencialPredioUseCase: new VerificarCredencialPredioUseCase(predioRepository, backend),
      verificarPublicacionSensorUseCase: new VerificarPublicacionSensorUseCase(predioRepository, envs.MQTT_USERNAME),
    });
  }
}
