// Los triggers de auditoria de rol/politica/usuario (ver
// bd/triggers_auditoria_seguridad.sql) leen quien hizo el cambio y desde
// donde con las variables de sesion de Postgres app.usuario_actual y
// app.ip_origen. SET LOCAL solo dura la transaccion actual, asi que hay
// que fijarlas y hacer la operacion real en la MISMA transaccion -- si se
// fijaran en una query aparte, Prisma podria tomar otra conexion del pool
// para la siguiente y el trigger no vería nada seteado.
// Si no se pasa id_usuario_actor (ej. registro publico sin sesion), el
// trigger cae a su propio fallback (el primer ADMIN) en vez de fallar.
// ip_origen es la IP del cliente HTTP (req.ip); si no se pasa, el trigger
// usa su propio placeholder ('0.0.0.0').
export async function conUsuarioActual(prisma, id_usuario_actor, ip_origen, operacion) {
  return prisma.$transaction(async (tx) => {
    if (id_usuario_actor != null) {
      await tx.$executeRaw`SELECT set_config('app.usuario_actual', ${String(id_usuario_actor)}, true)`;
    }
    if (ip_origen) {
      await tx.$executeRaw`SELECT set_config('app.ip_origen', ${String(ip_origen)}, true)`;
    }
    return operacion(tx);
  });
}
