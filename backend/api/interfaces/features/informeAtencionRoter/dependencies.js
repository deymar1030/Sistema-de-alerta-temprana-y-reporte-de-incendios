import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { InformeAtencionService } from "./services.js";
import { InformeAtencionController } from "./controller.js";
import PrismaInformeAtencionRepository from "../../../infrastructure/features/informeAtencion/repositories/informeAtencion.repository.impl.js";
import PrismaReporteURepository from "../../../infrastructure/features/reporteU/repositories/reporteU.repository.impl.js";
import PrismaNotificacionRepository from "../../../infrastructure/features/notificacion/repositories/notificacion.repository.impl.js";
import { RegistryRealtimeNotifier } from "../../../../websocketManager/notifierRegistry.js";
import CreateInformeAtencionUseCase from "../../../application/informeAtencion/useCases/createInformeAtencion.useCase.js";
import GetAllInformeAtencionUseCase from "../../../application/informeAtencion/useCases/getAllInformeAtencion.useCase.js";
import GetInformeAtencionUseCase from "../../../application/informeAtencion/useCases/getInformeAtencion.useCase.js";
import UpdateInformeAtencionUseCase from "../../../application/informeAtencion/useCases/updateInformeAtencion.useCase.js";

export class InformeAtencionDependencies {
  static createController() {
    const informeAtencionRepository = new PrismaInformeAtencionRepository(prisma);
    const reporteURepository = new PrismaReporteURepository(prisma);
    const notificacionRepository = new PrismaNotificacionRepository(prisma);
    // RegistryRealtimeNotifier resuelve el notifier real recien al emitir
    // (este router se construye antes de que exista -- ver notifierRegistry.js).
    const realtimeNotifier = new RegistryRealtimeNotifier();

    const useCases = {
      createInformeAtencionUseCase: new CreateInformeAtencionUseCase({ informeAtencionRepository, reporteURepository, notificacionRepository, realtimeNotifier }),
      getAllInformeAtencionUseCase: new GetAllInformeAtencionUseCase(informeAtencionRepository),
      getInformeAtencionUseCase: new GetInformeAtencionUseCase(informeAtencionRepository),
      updateInformeAtencionUseCase: new UpdateInformeAtencionUseCase({ informeAtencionRepository, reporteURepository, notificacionRepository, realtimeNotifier }),
    };

    const informeAtencionService = new InformeAtencionService(useCases);
    return new InformeAtencionController(informeAtencionService);
  }
}
