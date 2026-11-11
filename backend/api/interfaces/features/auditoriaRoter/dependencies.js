import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { AuditoriaService } from "./services.js";
import { AuditoriaController } from "./controller.js";
import PrismaAuditoriaRepository from "../../../infrastructure/features/auditoria/repositories/auditoria.repository.impl.js";
import GetAllAuditoriaUseCase from "../../../application/auditoria/useCases/getAllAuditoria.useCase.js";
import GetAllAuditoriaUsuarioUseCase from "../../../application/auditoria/useCases/getAllAuditoriaUsuario.useCase.js";

export class AuditoriaDependencies {
  static createController() {
    const auditoriaRepository = new PrismaAuditoriaRepository(prisma);

    const useCases = {
      getAllAuditoriaUseCase: new GetAllAuditoriaUseCase(auditoriaRepository),
      getAllAuditoriaUsuarioUseCase: new GetAllAuditoriaUsuarioUseCase(auditoriaRepository),
    };

    const auditoriaService = new AuditoriaService(useCases);
    return new AuditoriaController(auditoriaService);
  }
}
