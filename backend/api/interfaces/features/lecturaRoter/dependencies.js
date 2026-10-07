import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { LecturaService } from "./services.js";
import { LecturaController } from "./controller.js";
import PrismaLecturaRepository from "../../../infrastructure/features/lectura/repositories/lectura.repository.impl.js";
import GetAllLecturaUseCase from "../../../application/lectura/useCases/getAllLectura.useCase.js";
import GetLecturaUseCase from "../../../application/lectura/useCases/getLectura.useCase.js";

export class LecturaDependencies {
  static createController() {
    const lecturaRepository = new PrismaLecturaRepository(prisma);

    const useCases = {
      getAllLecturaUseCase: new GetAllLecturaUseCase(lecturaRepository),
      getLecturaUseCase: new GetLecturaUseCase(lecturaRepository),
    };

    const lecturaService = new LecturaService(useCases);
    return new LecturaController(lecturaService);
  }
}
