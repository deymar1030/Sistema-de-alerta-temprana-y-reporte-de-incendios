import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { ZonaGeograficaService } from "./services.js";
import { ZonaGeograficaController } from "./controller.js";
import PrismaZonaGeograficaRepository from "../../../infrastructure/features/zonaGeografica/repositories/zonaGeografica.repository.impl.js";
import CreateZonaGeograficaUseCase from "../../../application/zonaGeografica/useCases/createZonaGeografica.useCase.js";
import GetAllZonaGeograficaUseCase from "../../../application/zonaGeografica/useCases/getAllZonaGeografica.useCase.js";
import GetZonaGeograficaUseCase from "../../../application/zonaGeografica/useCases/getZonaGeografica.useCase.js";
import UpdateZonaGeograficaUseCase from "../../../application/zonaGeografica/useCases/updateZonaGeografica.useCase.js";
import DeleteZonaGeograficaUseCase from "../../../application/zonaGeografica/useCases/deleteZonaGeografica.useCase.js";

export class ZonaGeograficaDependencies {
  static createController() {
    const zonaGeograficaRepository = new PrismaZonaGeograficaRepository(prisma);

    const useCases = {
      createZonaGeograficaUseCase: new CreateZonaGeograficaUseCase(zonaGeograficaRepository),
      getAllZonaGeograficaUseCase: new GetAllZonaGeograficaUseCase(zonaGeograficaRepository),
      getZonaGeograficaUseCase: new GetZonaGeograficaUseCase(zonaGeograficaRepository),
      updateZonaGeograficaUseCase: new UpdateZonaGeograficaUseCase(zonaGeograficaRepository),
      deleteZonaGeograficaUseCase: new DeleteZonaGeograficaUseCase(zonaGeograficaRepository),
    };

    const zonaGeograficaService = new ZonaGeograficaService(useCases);
    return new ZonaGeograficaController(zonaGeograficaService);
  }
}
