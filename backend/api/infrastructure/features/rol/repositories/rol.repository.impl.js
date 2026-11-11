import RolRepository from "../../../../application/rol/repositories/rol.repository.js";
import { conUsuarioActual } from "../../../prismaConfig/conUsuarioActual.js";

export default class PrismaRolRepository extends RolRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // id_usuario_actor es quien queda registrado en auditoriau por
  // trg_historial_rol si esta llamada termina creando el rol (ver
  // conUsuarioActual.js). find() no dispara ese trigger, no necesita actor.
  async findOrCreateByNombre(nombre_rol, id_usuario_actor = null, ip_origen = null) {
    const existente = await this.prisma.rol.findUnique({ where: { nombre_rol } });
    if (existente) return existente;
    return conUsuarioActual(this.prisma, id_usuario_actor, ip_origen, (tx) =>
      tx.rol.create({ data: { nombre_rol } })
    );
  }
}
