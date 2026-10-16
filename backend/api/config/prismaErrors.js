// Traduce errores conocidos de Prisma a mensajes entendibles por el cliente.
// Usar en los casos de uso de "delete": si el borrado choca con una
// restriccion de llave foranea (P2003), el registro tiene datos asociados
// y hay que desactivarlo en vez de eliminarlo.
export function relanzarErrorEliminacion(error, entidad) {
  if (error?.code === "P2003") {
    throw new Error(`No se puede eliminar ${entidad}: tiene registros asociados. Desactivelo en vez de eliminarlo.`);
  }
  throw error;
}
