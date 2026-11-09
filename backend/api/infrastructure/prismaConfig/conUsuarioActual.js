// Los triggers de auditoria de rol/politica/usuario (ver bd/triggers-seguridad.sql)
// leen quien hizo el cambio desde la variable de sesion de Postgres
// app.usuario_actual. SET LOCAL solo dura la transaccion actual, asi que
// hay que fijarla y hacer la operacion real en la MISMA transaccion -- si
// se fijara en una query aparte, Prisma podria tomar otra conexion del
// pool para la siguiente y el trigger no vería nada seteado.
// Si no se pasa id_usuario_actor (ej. registro publico sin sesion), el
// trigger cae a su propio fallback (el primer ADMIN) en vez de fallar.
export async function conUsuarioActual(prisma, id_usuario_actor, operacion) {
  return prisma.$transaction(async (tx) => {
    if (id_usuario_actor != null) {
      await tx.$executeRaw`SELECT set_config('app.usuario_actual', ${String(id_usuario_actor)}, true)`;
    }
    return operacion(tx);
  });
}
