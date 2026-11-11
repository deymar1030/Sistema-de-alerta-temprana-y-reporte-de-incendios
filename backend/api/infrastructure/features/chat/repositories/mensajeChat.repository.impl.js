import MensajeChatRepository from "../../../../application/chat/repositories/mensajeChat.repository.js";

const AUTOR_SELECT = {
  usuario: { select: { nombre: true, primer_apellido: true } },
  institucion: { select: { nombre: true } },
};

export default class PrismaMensajeChatRepository extends MensajeChatRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(mensajeData) {
    return await this.prisma.mensaje_chat.create({
      data: {
        tipo_canal: mensajeData.tipo_canal,
        categoria: mensajeData.categoria,
        id_usuario: Number(mensajeData.id_usuario),
        id_institucion_emisor: Number(mensajeData.id_institucion_emisor),
        contenido: mensajeData.contenido,
      },
      include: AUTOR_SELECT,
    });
  }

  async findByCanal(tipo_canal, categoria, { antes, limite }) {
    const where = { tipo_canal, categoria: categoria ?? null };
    if (antes) where.id_mensaje = { lt: antes };

    return await this.prisma.mensaje_chat.findMany({
      where,
      orderBy: { id_mensaje: "desc" },
      take: limite,
      include: AUTOR_SELECT,
    });
  }
}
