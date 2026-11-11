export class ChatService {
  constructor({ enviarMensajeChatUseCase, listarMensajesChatUseCase }) {
    this.enviarMensajeChatUseCase = enviarMensajeChatUseCase;
    this.listarMensajesChatUseCase = listarMensajesChatUseCase;
  }

  async enviar({ tipo_canal, contenido, remitente }) {
    return await this.enviarMensajeChatUseCase.execute({ tipo_canal, contenido, remitente });
  }

  async listar({ tipo_canal, remitente, antes, limite }) {
    return await this.listarMensajesChatUseCase.execute({ tipo_canal, remitente, antes, limite });
  }
}
