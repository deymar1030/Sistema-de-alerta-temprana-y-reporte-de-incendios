import { MensajeChatMapper } from "../../../domain/chat/mappers/mensajeChat.mapper.js";

export class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
  }

  listarGlobal = async (req, res) => {
    try {
      const mensajes = await this.chatService.listar({
        tipo_canal: "GLOBAL",
        remitente: req.auth.usuario,
        antes: req.query.antes,
        limite: req.query.limite,
      });
      res.json({ success: true, data: MensajeChatMapper.toResponseDTOArray(mensajes) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  listarCategoria = async (req, res) => {
    try {
      const mensajes = await this.chatService.listar({
        tipo_canal: "CATEGORIA",
        remitente: req.auth.usuario,
        antes: req.query.antes,
        limite: req.query.limite,
      });
      res.json({ success: true, data: MensajeChatMapper.toResponseDTOArray(mensajes) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  enviar = async (req, res) => {
    try {
      const mensaje = await this.chatService.enviar({
        tipo_canal: req.body?.tipo_canal,
        contenido: req.body?.contenido,
        remitente: req.auth.usuario,
      });
      res.status(201).json({ success: true, data: MensajeChatMapper.toResponseDTO(mensaje) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
