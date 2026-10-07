import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";

import { AlertaService } from "./services.js";
import { AlertaController } from "./controller.js";

import PrismaAlertaRepository from "../../../infrastructure/features/alerta/repositories/alerta.repository.impl.js";

import GetAllAlertasUseCase from "../../../application/alerta/useCases/getAllAlertas.useCase.js";
import GetAlertaUseCase from "../../../application/alerta/useCases/getAlerta.useCase.js";
import GetAlertasActivasUseCase from "../../../application/alerta/useCases/getAlertasActivas.useCase.js";
import MarcarEnvioRecibidoUseCase from "../../../application/alerta/useCases/marcarEnvioRecibido.useCase.js";
import MarcarEnvioAtendidoUseCase from "../../../application/alerta/useCases/marcarEnvioAtendido.useCase.js";
import CerrarEnvioUseCase from "../../../application/alerta/useCases/cerrarEnvio.useCase.js";

export class AlertaDependencies {
  static createController() {
    const alertaRepository =
      new PrismaAlertaRepository(prisma);

    const useCases = {
      getAllAlertasUseCase:
        new GetAllAlertasUseCase(alertaRepository),

      getAlertaUseCase:
        new GetAlertaUseCase(alertaRepository),

      getAlertasActivasUseCase:
        new GetAlertasActivasUseCase(alertaRepository),

      marcarEnvioRecibidoUseCase:
        new MarcarEnvioRecibidoUseCase(alertaRepository),

      marcarEnvioAtendidoUseCase:
        new MarcarEnvioAtendidoUseCase(alertaRepository),

      cerrarEnvioUseCase:
        new CerrarEnvioUseCase(alertaRepository),
    };

    const alertaService =
      new AlertaService(useCases);

    return new AlertaController(alertaService);
  }
}