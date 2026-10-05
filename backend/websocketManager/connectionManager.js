import { rooms } from "./rooms.js";

// El "manager" en sentido estricto: solo conexion y membresia a rooms, sin
// reglas de negocio de alertas/lecturas (eso vive en notifier.js y, mas
// adelante, en los casos de uso de api/ -- docs/GuiaTiempoReal.md §3).
export function registerConnectionManager(io) {
  io.on("connection", (socket) => {
    const { usuario } = socket.data.auth;

    socket.join(rooms.usuario(usuario.id_usuario));
    if (usuario.id_institucion) {
      socket.join(rooms.institucion(usuario.id_institucion));
    }

    socket.on("disconnect", () => {
      // Socket.IO ya limpia las rooms solo al desconectar; no hace falta
      // nada mas aca por ahora.
    });
  });
}
