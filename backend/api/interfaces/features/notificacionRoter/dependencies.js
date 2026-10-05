import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { NotificacionService } from "./services.js";
import { NotificacionController } from "./controller.js";
import PrismaNotificacionRepository from "../../../infrastructure/features/notificacion/repositories/notificacion.repository.impl.js";
import GetAllNotificacionUseCase from "../../../application/notificacion/useCases/getAllNotificacion.useCase.js";
import CountNoLeidasNotificacionUseCase from "../../../application/notificacion/useCases/countNoLeidasNotificacion.useCase.js";
import MarcarLeidaNotificacionUseCase from "../../../application/notificacion/useCases/marcarLeidaNotificacion.useCase.js";
import MarcarTodasLeidasNotificacionUseCase from "../../../application/notificacion/useCases/marcarTodasLeidasNotificacion.useCase.js";

export class NotificacionDependencies {
  static createController() {
    const notificacionRepository = new PrismaNotificacionRepository(prisma);

    const useCases = {
      getAllNotificacionUseCase: new GetAllNotificacionUseCase(notificacionRepository),
      countNoLeidasNotificacionUseCase: new CountNoLeidasNotificacionUseCase(notificacionRepository),
      marcarLeidaNotificacionUseCase: new MarcarLeidaNotificacionUseCase(notificacionRepository),
      marcarTodasLeidasNotificacionUseCase: new MarcarTodasLeidasNotificacionUseCase(notificacionRepository),
    };

    const notificacionService = new NotificacionService(useCases);
    return new NotificacionController(notificacionService);
  }
}
