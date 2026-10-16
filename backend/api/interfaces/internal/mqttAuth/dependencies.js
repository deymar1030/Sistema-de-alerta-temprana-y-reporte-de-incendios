import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { MqttAuthController } from "./controller.js";
import PrismaPredioRepository from "../../../infrastructure/features/predio/repositories/predio.repository.impl.js";
import VerificarCredencialPredioUseCase from "../../../application/mqttAuth/useCases/verificarCredencialPredio.useCase.js";
import VerificarPublicacionSensorUseCase from "../../../application/mqttAuth/useCases/verificarPublicacionSensor.useCase.js";

export class MqttAuthDependencies {
  static createController() {
    const predioRepository = new PrismaPredioRepository(prisma);

    return new MqttAuthController({
      verificarCredencialPredioUseCase: new VerificarCredencialPredioUseCase(predioRepository),
      verificarPublicacionSensorUseCase: new VerificarPublicacionSensorUseCase(predioRepository),
    });
  }
}
