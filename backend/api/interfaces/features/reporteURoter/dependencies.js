import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { ReporteUService } from "./services.js";
import { ReporteUController } from "./controller.js";
import PrismaReporteURepository from "../../../infrastructure/features/reporteU/repositories/reporteU.repository.impl.js";
import HttpClasificadorImagenRepository from "../../../infrastructure/features/deteccionImagen/repositories/httpClasificadorImagen.repository.impl.js";
import PrismaAlertaDesdeReporteRepository from "../../../infrastructure/features/deteccionImagen/repositories/prismaAlertaDesdeReporte.repository.impl.js";
import HttpCalculadoraRutasRepository from "../../../infrastructure/features/alerta/repositories/httpCalculadoraRutas.repository.impl.js";
import PrismaEnviaRepository from "../../../infrastructure/features/envia/repositories/envia.repository.impl.js";
import { RegistryRealtimeNotifier } from "../../../../websocketManager/notifierRegistry.js";
import CreateReporteUUseCase from "../../../application/reporteU/useCases/createReporteU.useCase.js";
import GetAllReporteUUseCase from "../../../application/reporteU/useCases/getAllReporteU.useCase.js";
import GetReporteUUseCase from "../../../application/reporteU/useCases/getReporteU.useCase.js";
import UpdateEstadoReporteUUseCase from "../../../application/reporteU/useCases/updateEstadoReporteU.useCase.js";
import VincularAlertaReporteUUseCase from "../../../application/reporteU/useCases/vincularAlertaReporteU.useCase.js";

export class ReporteUDependencies {
  static createController() {
    const reporteURepository = new PrismaReporteURepository(prisma);
    const clasificadorImagenRepository = new HttpClasificadorImagenRepository();
    const alertaDesdeReporteRepository = new PrismaAlertaDesdeReporteRepository(prisma);

    const useCases = {
      // RegistryRealtimeNotifier resuelve el notifier real recien al emitir
      // (este router se construye antes de que exista -- ver notifierRegistry.js).
      createReporteUUseCase: new CreateReporteUUseCase({
        reporteURepository,
        clasificadorImagenRepository,
        alertaDesdeReporteRepository,
        realtimeNotifier: new RegistryRealtimeNotifier(),
        calculadoraRutasRepository: new HttpCalculadoraRutasRepository(),
        enviaRepository: new PrismaEnviaRepository(prisma),
      }),
      getAllReporteUUseCase: new GetAllReporteUUseCase(reporteURepository),
      getReporteUUseCase: new GetReporteUUseCase(reporteURepository),
      updateEstadoReporteUUseCase: new UpdateEstadoReporteUUseCase(reporteURepository),
      vincularAlertaReporteUUseCase: new VincularAlertaReporteUUseCase(reporteURepository),
    };

    const reporteUService = new ReporteUService(useCases);
    return new ReporteUController(reporteUService);
  }
}
