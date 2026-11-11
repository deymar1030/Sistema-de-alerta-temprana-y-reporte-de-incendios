import { rooms } from "./rooms.js";
import { RolNombres } from "../api/domain/rol/rolNombres.js";

const ROLES_CHAT = [RolNombres.JEFE_INSTITUCION, RolNombres.OPERATIVO];

export function registerConnectionManager(io, { validateSesion, existeRecurso }) {
  io.on("connection", (socket) => {
    const { usuario } = socket.data.auth;

    socket.join(rooms.usuario(usuario.id_usuario));
    if (usuario.id_institucion) {
      socket.join(rooms.institucion(usuario.id_institucion));
    }
    // Chat de coordinacion: solo jefes/operativos de institucion, que son
    // quienes lo usan (ver chatRoter/routes.js). El canal de categoria
    // depende de la institucion del usuario, ya viaja en la sesion.
    if (ROLES_CHAT.includes(usuario.rol?.nombre_rol) && usuario.institucion?.categoria) {
      socket.join(rooms.chatGlobal());
      socket.join(rooms.chatCategoria(usuario.institucion.categoria));
    }
    const suscripciones = new Set();
    let validando = false;
    const validar = async () => {
      const actual = await validateSesion.execute(socket.data.sessionToken);
      if (String(actual.usuario.id_institucion) !== String(usuario.id_institucion) || String(actual.usuario.id_rol) !== String(usuario.id_rol)) {
        throw new Error('Permisos modificados; reconectar');
      }
      return actual;
    };
    // Verificar revocacion y vencimiento tambien en conexiones que no envian eventos.
    const timer = setInterval(async () => {
      if (validando) return;
      validando = true;
      try { await validar(); } catch { socket.disconnect(true); }
      finally { validando = false; }
    }, 30000);
    timer.unref();
    const vencimiento = setTimeout(() => socket.disconnect(true), Math.min(2147483647, Math.max(0, +new Date(socket.data.auth.sesion.expira_en) - Date.now())));
    vencimiento.unref();
    socket.on('disconnect', () => { clearInterval(timer); clearTimeout(vencimiento); });

    for (const tipo of ['predio', 'sensor']) {
      for (const accion of ['suscribir', 'desuscribir']) {
        socket.on(`${tipo}:${accion}`, async (payload, responder) => {
          const ack = typeof responder === 'function' ? responder : () => {};
          let room;
          try {
            const id = String(payload?.[`id_${tipo}`] ?? '');
            if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) throw new Error('ID invalido');
            room = rooms[tipo](id);
            await validar();
            if (!socket.connected) return;
            if (accion === 'desuscribir') {
              await socket.leave(room);
              suscripciones.delete(room);
            } else {
              if (!suscripciones.has(room) && suscripciones.size >= 50) throw new Error('Limite de suscripciones alcanzado');
              suscripciones.add(room);
              if (!(await existeRecurso(tipo, BigInt(id)))) throw new Error('Recurso no encontrado');
              if (!socket.connected) return;
              await socket.join(room);
            }
            ack({ ok: true, room });
          } catch (error) {
            if (room) suscripciones.delete(room);
            ack({ ok: false, error: ['ID invalido', 'Limite de suscripciones alcanzado', 'Recurso no encontrado'].includes(error.message) ? error.message : 'Suscripcion no autorizada o no disponible' });
          }
        });
      }
    }
  });
}
