import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { InformeAtencionService } from "./services.js";
import { InformeAtencionController } from "./controller.js";
import PrismaInformeAtencionRepository from "../../../infrastructure/features/informeAtencion/repositories/informeAtencion.repository.impl.js";
import CreateInformeAtencionUseCase from "../../../application/informeAtencion/useCases/createInformeAtencion.useCase.js";
import GetAllInformeAtencionUseCase from "../../../application/informeAtencion/useCases/getAllInformeAtencion.useCase.js";
import GetInformeAtencionUseCase from "../../../application/informeAtencion/useCases/getInformeAtencion.useCase.js";
import UpdateInformeAtencionUseCase from "../../../application/informeAtencion/useCases/updateInformeAtencion.useCase.js";

export class InformeAtencionDependencies {
  static createController() {
    const informeAtencionRepository = new PrismaInformeAtencionRepository(prisma);

    const useCases = {
      createInformeAtencionUseCase: new CreateInformeAtencionUseCase(informeAtencionRepository),
      getAllInformeAtencionUseCase: new GetAllInformeAtencionUseCase(informeAtencionRepository),
      getInformeAtencionUseCase: new GetInformeAtencionUseCase(informeAtencionRepository),
      updateInformeAtencionUseCase: new UpdateInformeAtencionUseCase(informeAtencionRepository),
    };

    const informeAtencionService = new InformeAtencionService(useCases);
    return new InformeAtencionController(informeAtencionService);
  }
}
