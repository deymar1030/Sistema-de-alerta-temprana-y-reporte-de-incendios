import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { ChatService } from "./services.js";
import { ChatController } from "./controller.js";
import PrismaMensajeChatRepository from "../../../infrastructure/features/chat/repositories/mensajeChat.repository.impl.js";
import { RegistryRealtimeNotifier } from "../../../../websocketManager/notifierRegistry.js";
import EnviarMensajeChatUseCase from "../../../application/chat/useCases/enviarMensajeChat.useCase.js";
import ListarMensajesChatUseCase from "../../../application/chat/useCases/listarMensajesChat.useCase.js";

export class ChatDependencies {
  static createController() {
    const mensajeChatRepository = new PrismaMensajeChatRepository(prisma);

    const useCases = {
      // RegistryRealtimeNotifier resuelve el notifier real recien al emitir
      // (este router se construye antes de que exista -- ver notifierRegistry.js).
      enviarMensajeChatUseCase: new EnviarMensajeChatUseCase({
        mensajeChatRepository,
        realtimeNotifier: new RegistryRealtimeNotifier(),
      }),
      listarMensajesChatUseCase: new ListarMensajesChatUseCase(mensajeChatRepository),
    };

    const chatService = new ChatService(useCases);
    return new ChatController(chatService);
  }
}
