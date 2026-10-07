import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { envs } from "../../../config/envs.js";
import PrismaAuthRepository from "../../../infrastructure/features/auth/repositories/auth.repository.impl.js";
import PrismaSesionRepository from "../../../infrastructure/features/sesion/repositories/sesion.repository.impl.js";
import AuthenticateUseCase from "../../../application/auth/useCases/authenticate.useCase.js";
import CreateSesionUseCase from "../../../application/sesion/useCases/createSesion.useCase.js";
import ValidateSesionUseCase from "../../../application/sesion/useCases/validateSesion.useCase.js";
import RevokeSesionUseCase from "../../../application/sesion/useCases/revokeSesion.useCase.js";
import GetSesionesActivasUseCase from "../../../application/sesion/useCases/getSesionesActivas.useCase.js";
import { AuthService } from "./services.js";
import { AuthController } from "./controller.js";
import { createRequireAuth } from "../../middlewares/requireAuth.middleware.js";

let useCases = null;

function getUseCases() {
  if (useCases) return useCases;

  const authRepository = new PrismaAuthRepository(prisma);
  const sesionRepository = new PrismaSesionRepository(prisma);

  useCases = {
    authenticateUseCase: new AuthenticateUseCase(authRepository),
    createSesionUseCase: new CreateSesionUseCase(sesionRepository, {
      ttlHoras: envs.SESSION_TTL_HOURS,
    }),
    validateSesionUseCase: new ValidateSesionUseCase(sesionRepository),
    revokeSesionUseCase: new RevokeSesionUseCase(sesionRepository),
    getSesionesActivasUseCase: new GetSesionesActivasUseCase(sesionRepository),
  };

  return useCases;
}

export class AuthDependencies {
  static createController() {
    return new AuthController(new AuthService(getUseCases()));
  }

  // Middleware que protege rutas: se usa en interfaces/router.js.
  static createRequireAuth() {
    return createRequireAuth(getUseCases().validateSesionUseCase);
  }

  static createValidateSesion() {
    return getUseCases().validateSesionUseCase;
  }
}
