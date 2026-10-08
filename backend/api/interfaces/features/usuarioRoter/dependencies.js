import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { UsuarioService } from "./services.js";
import { UsuarioController } from "./controller.js";
import PrismaUsuarioRepository from "../../../infrastructure/features/usuario/repositories/usuario.repository.impl.js";
import CreateUsuarioUseCase from "../../../application/usuario/useCases/createUsuario.useCase.js";
import GetAllUsuarioUseCase from "../../../application/usuario/useCases/getAllUsuario.useCase.js";
import GetUsuarioUseCase from "../../../application/usuario/useCases/getUsuario.useCase.js";
import UpdateUsuarioUseCase from "../../../application/usuario/useCases/updateUsuario.useCase.js";
import DesactivarUsuarioUseCase from "../../../application/usuario/useCases/desactivarUsuario.useCase.js";
import ReactivarUsuarioUseCase from "../../../application/usuario/useCases/reactivarUsuario.useCase.js";
import GetOperativosInstitucionUseCase from "../../../application/usuario/useCases/getOperativosInstitucion.useCase.js";

export class UsuarioDependencies {
  static createController() {
    const usuarioRepository = new PrismaUsuarioRepository(prisma);

    const useCases = {
      createUsuarioUseCase: new CreateUsuarioUseCase(usuarioRepository),
      getAllUsuarioUseCase: new GetAllUsuarioUseCase(usuarioRepository),
      getUsuarioUseCase: new GetUsuarioUseCase(usuarioRepository),
      updateUsuarioUseCase: new UpdateUsuarioUseCase(usuarioRepository),
      desactivarUsuarioUseCase: new DesactivarUsuarioUseCase(usuarioRepository),
      reactivarUsuarioUseCase: new ReactivarUsuarioUseCase(usuarioRepository),
      getOperativosInstitucionUseCase: new GetOperativosInstitucionUseCase(usuarioRepository),
    };

    const usuarioService = new UsuarioService(useCases);
    return new UsuarioController(usuarioService);
  }
}
