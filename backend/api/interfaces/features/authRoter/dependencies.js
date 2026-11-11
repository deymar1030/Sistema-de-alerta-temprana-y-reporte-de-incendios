import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { envs } from "../../../config/envs.js";
import PrismaAuthRepository from "../../../infrastructure/features/auth/repositories/auth.repository.impl.js";
import PrismaSesionRepository from "../../../infrastructure/features/sesion/repositories/sesion.repository.impl.js";
import PrismaUsuarioRepository from "../../../infrastructure/features/usuario/repositories/usuario.repository.impl.js";
import PrismaRolRepository from "../../../infrastructure/features/rol/repositories/rol.repository.impl.js";
import PrismaPoliticaRepository from "../../../infrastructure/features/politica/repositories/politica.repository.impl.js";
import AuthenticateUseCase from "../../../application/auth/useCases/authenticate.useCase.js";
import RegisterUseCase from "../../../application/auth/useCases/register.useCase.js";
import IniciarMfaUseCase from "../../../application/auth/useCases/iniciarMfa.useCase.js";
import VerificarMfaUseCase from "../../../application/auth/useCases/verificarMfa.useCase.js";
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
  const usuarioRepository = new PrismaUsuarioRepository(prisma);
  const rolRepository = new PrismaRolRepository(prisma);
  const politicaRepository = new PrismaPoliticaRepository(prisma);

  useCases = {
    authenticateUseCase: new AuthenticateUseCase({
      authRepository,
      usuarioRepository,
      politicaRepository,
      sesionRepository,
    }),
    registerUseCase: new RegisterUseCase({ authRepository, usuarioRepository, rolRepository }),
    createSesionUseCase: new CreateSesionUseCase(sesionRepository, {
      ttlHoras: envs.SESSION_TTL_HOURS,
    }),
    validateSesionUseCase: new ValidateSesionUseCase(sesionRepository),
    revokeSesionUseCase: new RevokeSesionUseCase(sesionRepository),
    getSesionesActivasUseCase: new GetSesionesActivasUseCase(sesionRepository),
    iniciarMfaUseCase: new IniciarMfaUseCase({ usuarioRepository }),
    verificarMfaUseCase: new VerificarMfaUseCase(
      { usuarioRepository, sesionRepository },
      { ttlHoras: envs.SESSION_TTL_HOURS }
    ),
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

  // Solo para /auth/mfa/*: exige una sesion pendiente de MFA, no una completa.
  static createRequireMfaPendiente() {
    return createRequireAuth(getUseCases().validateSesionUseCase, { permitirMfaPendiente: true });
  }

  static createValidateSesion() {
    return getUseCases().validateSesionUseCase;
  }
}
