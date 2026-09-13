import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { UbicacionGeograficaService } from "./services.js";
import { UbicacionGeograficaController } from "./controller.js";
import PrismaUbicacionGeograficaRepository from "../../../infrastructure/features/ubicacionGeografica/repositories/ubicacionGeografica.repository.impl.js";
import CreateUbicacionGeograficaUseCase from "../../../application/ubicacionGeografica/useCases/createUbicacionGeografica.useCase.js";
import GetAllUbicacionGeograficaUseCase from "../../../application/ubicacionGeografica/useCases/getAllUbicacionGeografica.useCase.js";
import GetUbicacionGeograficaUseCase from "../../../application/ubicacionGeografica/useCases/getUbicacionGeografica.useCase.js";
import UpdateUbicacionGeograficaUseCase from "../../../application/ubicacionGeografica/useCases/updateUbicacionGeografica.useCase.js";
import DeleteUbicacionGeograficaUseCase from "../../../application/ubicacionGeografica/useCases/deleteUbicacionGeografica.useCase.js";

export class UbicacionGeograficaDependencies {
  static createController() {
    const ubicacionGeograficaRepository = new PrismaUbicacionGeograficaRepository(prisma);

    const useCases = {
      createUbicacionGeograficaUseCase: new CreateUbicacionGeograficaUseCase(ubicacionGeograficaRepository),
      getAllUbicacionGeograficaUseCase: new GetAllUbicacionGeograficaUseCase(ubicacionGeograficaRepository),
      getUbicacionGeograficaUseCase: new GetUbicacionGeograficaUseCase(ubicacionGeograficaRepository),
      updateUbicacionGeograficaUseCase: new UpdateUbicacionGeograficaUseCase(ubicacionGeograficaRepository),
      deleteUbicacionGeograficaUseCase: new DeleteUbicacionGeograficaUseCase(ubicacionGeograficaRepository),
    };

    const ubicacionGeograficaService = new UbicacionGeograficaService(useCases);
    return new UbicacionGeograficaController(ubicacionGeograficaService);
  }
}