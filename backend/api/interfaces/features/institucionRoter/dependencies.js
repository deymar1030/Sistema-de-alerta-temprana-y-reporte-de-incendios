import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { InstitucionService } from "./services.js";
import { InstitucionController } from "./controller.js";
import PrismaInstitucionRepository from "../../../infrastructure/features/institucion/repositories/institucion.repository.impl.js";

import CreateInstitucionUseCase from "../../../application/institucion/useCases/createInstitucion.useCase.js";
import GetAllInstitucionUseCase from "../../../application/institucion/useCases/getAllInstitucion.useCase.js";
import GetInstitucionUseCase from "../../../application/institucion/useCases/getInstitucion.useCase.js";
import UpdateInstitucionUseCase from "../../../application/institucion/useCases/updateInstitucion.useCase.js";
import DeleteInstitucionUseCase from "../../../application/institucion/useCases/deleteInstitucion.useCase.js";

export class InstitucionDependencies {
  static createController() {
    const institucionRepository =
      new PrismaInstitucionRepository(prisma);

    const useCases = {
      createInstitucionUseCase:
        new CreateInstitucionUseCase(institucionRepository),

      getAllInstitucionUseCase:
        new GetAllInstitucionUseCase(institucionRepository),

      getInstitucionUseCase:
        new GetInstitucionUseCase(institucionRepository),

      updateInstitucionUseCase:
        new UpdateInstitucionUseCase(institucionRepository),

      deleteInstitucionUseCase:
        new DeleteInstitucionUseCase(institucionRepository),
    };

    const institucionService =
      new InstitucionService(useCases);

    return new InstitucionController(institucionService);
  }
}