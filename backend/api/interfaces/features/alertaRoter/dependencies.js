import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { AlertaService } from "./services.js";
import { AlertaController } from "./controller.js";
import PrismaAlertaRepository from "../../../infrastructure/features/alerta/repositories/alerta.repository.impl.js";
import PrismaEnviaRepository from "../../../infrastructure/features/envia/repositories/envia.repository.impl.js";
import PrismaInstitucionRepository from "../../../infrastructure/features/institucion/repositories/institucion.repository.impl.js";
import PrismaUsuarioRepository from "../../../infrastructure/features/usuario/repositories/usuario.repository.impl.js";
import PrismaNotificacionRepository from "../../../infrastructure/features/notificacion/repositories/notificacion.repository.impl.js";
import GetAllAlertaUseCase from "../../../application/alerta/useCases/getAllAlerta.useCase.js";
import GetActivasAlertaUseCase from "../../../application/alerta/useCases/getActivasAlerta.useCase.js";
import GetAlertaUseCase from "../../../application/alerta/useCases/getAlerta.useCase.js";
import RecibirEnvioUseCase from "../../../application/envia/useCases/recibirEnvio.useCase.js";
import AtenderEnvioUseCase from "../../../application/envia/useCases/atenderEnvio.useCase.js";
import CerrarEnvioUseCase from "../../../application/envia/useCases/cerrarEnvio.useCase.js";
import DespacharAlertaManualUseCase from "../../../application/envia/useCases/despacharAlertaManual.useCase.js";
import { RegistryRealtimeNotifier } from '../../../../websocketManager/notifierRegistry.js';

export class AlertaDependencies {
  static createController() {
    const alertaRepository = new PrismaAlertaRepository(prisma);
    const enviaRepository = new PrismaEnviaRepository(prisma);
    const institucionRepository = new PrismaInstitucionRepository(prisma);
    const usuarioRepository = new PrismaUsuarioRepository(prisma);
    const notificacionRepository = new PrismaNotificacionRepository(prisma);
    const realtimeNotifier = new RegistryRealtimeNotifier();

    const useCases = {
      realtimeNotifier,
      getAllAlertaUseCase: new GetAllAlertaUseCase(alertaRepository),
      getActivasAlertaUseCase: new GetActivasAlertaUseCase(alertaRepository),
      getAlertaUseCase: new GetAlertaUseCase(alertaRepository),
      recibirEnvioUseCase: new RecibirEnvioUseCase(enviaRepository),
      atenderEnvioUseCase: new AtenderEnvioUseCase(enviaRepository),
      cerrarEnvioUseCase: new CerrarEnvioUseCase(enviaRepository),
      despacharAlertaManualUseCase: new DespacharAlertaManualUseCase({
        alertaRepository,
        enviaRepository,
        institucionRepository,
        usuarioRepository,
        notificacionRepository,
        notifier: realtimeNotifier,
      }),
    };

    const alertaService = new AlertaService(useCases);
    return new AlertaController(alertaService);
  }
}
