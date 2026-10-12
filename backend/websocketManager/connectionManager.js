import { rooms } from "./rooms.js";

export function registerConnectionManager(io, { validateSesion, existeRecurso }) {
  io.on("connection", (socket) => {
    const { usuario } = socket.data.auth;

    socket.join(rooms.usuario(usuario.id_usuario));
    if (usuario.id_institucion) {
      socket.join(rooms.institucion(usuario.id_institucion));
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
