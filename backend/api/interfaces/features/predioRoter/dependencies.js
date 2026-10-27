import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { PredioService } from "./services.js";
import { PredioController } from "./controller.js";
import PrismaPredioRepository from "../../../infrastructure/features/predio/repositories/predio.repository.impl.js";
import CreatePredioUseCase from "../../../application/predio/useCases/createPredio.useCase.js";
import GetAllPredioUseCase from "../../../application/predio/useCases/getAllPredio.useCase.js";
import GetPredioUseCase from "../../../application/predio/useCases/getPredio.useCase.js";
import GetMapaPredioUseCase from "../../../application/predio/useCases/getMapaPredio.useCase.js";
import UpdatePredioUseCase from "../../../application/predio/useCases/updatePredio.useCase.js";
import DeletePredioUseCase from "../../../application/predio/useCases/deletePredio.useCase.js";

export class PredioDependencies {
  static createController() {
    const predioRepository = new PrismaPredioRepository(prisma);

    const useCases = {
      createPredioUseCase: new CreatePredioUseCase(predioRepository),
      getAllPredioUseCase: new GetAllPredioUseCase(predioRepository),
      getPredioUseCase: new GetPredioUseCase(predioRepository),
      getMapaPredioUseCase: new GetMapaPredioUseCase(predioRepository),
      updatePredioUseCase: new UpdatePredioUseCase(predioRepository),
      deletePredioUseCase: new DeletePredioUseCase(predioRepository),
    };

    const predioService = new PredioService(useCases);
    return new PredioController(predioService);
  }
}
