import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { NotificacionService } from "./services.js";
import { NotificacionController } from "./controller.js";
import PrismaNotificacionRepository from "../../../infrastructure/features/notificacion/repositories/notificacion.repository.impl.js";
import PrismaUsuarioRepository from "../../../infrastructure/features/usuario/repositories/usuario.repository.impl.js";
import PrismaEnviaRepository from "../../../infrastructure/features/envia/repositories/envia.repository.impl.js";
import { RegistryRealtimeNotifier } from "../../../../websocketManager/notifierRegistry.js";
import GetAllNotificacionUseCase from "../../../application/notificacion/useCases/getAllNotificacion.useCase.js";
import CountNoLeidasNotificacionUseCase from "../../../application/notificacion/useCases/countNoLeidasNotificacion.useCase.js";
import MarcarLeidaNotificacionUseCase from "../../../application/notificacion/useCases/marcarLeidaNotificacion.useCase.js";
import MarcarTodasLeidasNotificacionUseCase from "../../../application/notificacion/useCases/marcarTodasLeidasNotificacion.useCase.js";
import AsignarAlertaOperativosUseCase from "../../../application/notificacion/useCases/asignarAlertaOperativos.useCase.js";

export class NotificacionDependencies {
  static createController() {
    const notificacionRepository = new PrismaNotificacionRepository(prisma);
    const usuarioRepository = new PrismaUsuarioRepository(prisma);
    const enviaRepository = new PrismaEnviaRepository(prisma);

    const useCases = {
      getAllNotificacionUseCase: new GetAllNotificacionUseCase(notificacionRepository),
      countNoLeidasNotificacionUseCase: new CountNoLeidasNotificacionUseCase(notificacionRepository),
      marcarLeidaNotificacionUseCase: new MarcarLeidaNotificacionUseCase(notificacionRepository),
      marcarTodasLeidasNotificacionUseCase: new MarcarTodasLeidasNotificacionUseCase(notificacionRepository),
      // RegistryRealtimeNotifier resuelve el notifier real recien al emitir
      // (este router se construye antes de que exista -- ver notifierRegistry.js).
      asignarAlertaOperativosUseCase: new AsignarAlertaOperativosUseCase({
        notificacionRepository,
        usuarioRepository,
        enviaRepository,
        realtimeNotifier: new RegistryRealtimeNotifier(),
      }),
    };

    const notificacionService = new NotificacionService(useCases);
    return new NotificacionController(notificacionService);
  }
}
