import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { MotorDetService } from "./services.js";
import { MotorDetController } from "./controller.js";
import PrismaMotorDetRepository from "../../../infrastructure/features/motorDet/repositories/motorDet.repository.impl.js";
import GetAllMotorDetUseCase from "../../../application/motorDet/useCases/getAllMotorDet.useCase.js";
import GetMotorDetUseCase from "../../../application/motorDet/useCases/getMotorDet.useCase.js";

export class MotorDetDependencies {
  static createController() {
    const motorDetRepository = new PrismaMotorDetRepository(prisma);

    const useCases = {
      getAllMotorDetUseCase: new GetAllMotorDetUseCase(motorDetRepository),
      getMotorDetUseCase: new GetMotorDetUseCase(motorDetRepository),
    };

    const motorDetService = new MotorDetService(useCases);
    return new MotorDetController(motorDetService);
  }
}
