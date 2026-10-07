import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { AlertaService } from "./services.js";
import { AlertaController } from "./controller.js";
import PrismaAlertaRepository from "../../../infrastructure/features/alerta/repositories/alerta.repository.impl.js";
import PrismaEnviaRepository from "../../../infrastructure/features/envia/repositories/envia.repository.impl.js";
import GetAllAlertaUseCase from "../../../application/alerta/useCases/getAllAlerta.useCase.js";
import GetActivasAlertaUseCase from "../../../application/alerta/useCases/getActivasAlerta.useCase.js";
import GetAlertaUseCase from "../../../application/alerta/useCases/getAlerta.useCase.js";
import RecibirEnvioUseCase from "../../../application/envia/useCases/recibirEnvio.useCase.js";
import AtenderEnvioUseCase from "../../../application/envia/useCases/atenderEnvio.useCase.js";
import CerrarEnvioUseCase from "../../../application/envia/useCases/cerrarEnvio.useCase.js";

export class AlertaDependencies {
  static createController() {
    const alertaRepository = new PrismaAlertaRepository(prisma);
    const enviaRepository = new PrismaEnviaRepository(prisma);

    const useCases = {
      getAllAlertaUseCase: new GetAllAlertaUseCase(alertaRepository),
      getActivasAlertaUseCase: new GetActivasAlertaUseCase(alertaRepository),
      getAlertaUseCase: new GetAlertaUseCase(alertaRepository),
      recibirEnvioUseCase: new RecibirEnvioUseCase(enviaRepository),
      atenderEnvioUseCase: new AtenderEnvioUseCase(enviaRepository),
      cerrarEnvioUseCase: new CerrarEnvioUseCase(enviaRepository),
    };

    const alertaService = new AlertaService(useCases);
    return new AlertaController(alertaService);
  }
}
