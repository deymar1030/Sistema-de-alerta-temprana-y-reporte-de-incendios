import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { ReporteUService } from "./services.js";
import { ReporteUController } from "./controller.js";
import PrismaReporteURepository from "../../../infrastructure/features/reporteU/repositories/reporteU.repository.impl.js";
import CreateReporteUUseCase from "../../../application/reporteU/useCases/createReporteU.useCase.js";
import GetAllReporteUUseCase from "../../../application/reporteU/useCases/getAllReporteU.useCase.js";
import GetReporteUUseCase from "../../../application/reporteU/useCases/getReporteU.useCase.js";
import UpdateEstadoReporteUUseCase from "../../../application/reporteU/useCases/updateEstadoReporteU.useCase.js";
import VincularAlertaReporteUUseCase from "../../../application/reporteU/useCases/vincularAlertaReporteU.useCase.js";

export class ReporteUDependencies {
  static createController() {
    const reporteURepository = new PrismaReporteURepository(prisma);

    const useCases = {
      createReporteUUseCase: new CreateReporteUUseCase(reporteURepository),
      getAllReporteUUseCase: new GetAllReporteUUseCase(reporteURepository),
      getReporteUUseCase: new GetReporteUUseCase(reporteURepository),
      updateEstadoReporteUUseCase: new UpdateEstadoReporteUUseCase(reporteURepository),
      vincularAlertaReporteUUseCase: new VincularAlertaReporteUUseCase(reporteURepository),
    };

    const reporteUService = new ReporteUService(useCases);
    return new ReporteUController(reporteUService);
  }
}
