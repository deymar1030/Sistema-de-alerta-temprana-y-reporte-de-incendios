import { rooms } from "./rooms.js";

export function registerConnectionManager(io) {
  io.on("connection", (socket) => {
    const { usuario } = socket.data.auth;

    socket.join(rooms.usuario(usuario.id_usuario));
    if (usuario.id_institucion) {
      socket.join(rooms.institucion(usuario.id_institucion));
    }
  });
}
