const LIMITE_DEFAULT = 50;
const LIMITE_MAX = 100;

// Igual que al enviar: el canal CATEGORIA siempre resuelve a la categoria
// del que consulta, nunca a un parametro libre -- asi nadie lee el canal de
// una categoria que no es la suya.
export default class ListarMensajesChatUseCase {
  constructor(mensajeChatRepository) {
    this.mensajeChatRepository = mensajeChatRepository;
  }

  async execute({ tipo_canal, remitente, antes, limite }) {
    if (!["GLOBAL", "CATEGORIA"].includes(tipo_canal)) {
      throw new Error("tipo_canal must be one of: GLOBAL, CATEGORIA");
    }
    if (!remitente?.id_institucion) {
      throw new Error("Tu usuario no pertenece a ninguna institucion");
    }

    const categoria = tipo_canal === "CATEGORIA" ? remitente.institucion?.categoria : null;
    if (tipo_canal === "CATEGORIA" && !categoria) {
      throw new Error("Tu institucion no tiene categoria configurada");
    }

    const limiteFinal = Math.min(LIMITE_MAX, Math.max(1, Number(limite) || LIMITE_DEFAULT));

    return await this.mensajeChatRepository.findByCanal(tipo_canal, categoria, {
      antes: antes ? Number(antes) : undefined,
      limite: limiteFinal,
    });
  }
}
