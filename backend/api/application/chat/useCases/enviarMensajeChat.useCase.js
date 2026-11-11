import { CreateMensajeChatDTO } from "../../../domain/chat/dtos/createMensajeChat.dto.js";

// La categoria del canal CATEGORIA sale SIEMPRE de la institucion del
// remitente (nunca del body): evita que alguien postee en el canal de otra
// categoria declarando una distinta a la suya.
export default class EnviarMensajeChatUseCase {
  constructor({ mensajeChatRepository, realtimeNotifier }) {
    this.mensajeChatRepository = mensajeChatRepository;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute({ tipo_canal, contenido, remitente }) {
    const errors = CreateMensajeChatDTO.validate({ tipo_canal, contenido });
    if (errors.length) throw new Error(errors.join("; "));

    if (!remitente?.id_institucion) {
      throw new Error("Tu usuario no pertenece a ninguna institucion");
    }

    const categoria = tipo_canal === "CATEGORIA" ? remitente.institucion?.categoria : null;
    if (tipo_canal === "CATEGORIA" && !categoria) {
      throw new Error("Tu institucion no tiene categoria configurada");
    }

    const mensaje = await this.mensajeChatRepository.create({
      tipo_canal,
      categoria,
      id_usuario: remitente.id_usuario,
      id_institucion_emisor: remitente.id_institucion,
      contenido: String(contenido).trim(),
    });

    await this.realtimeNotifier.emitMensajeChat(mensaje);

    return mensaje;
  }
}
