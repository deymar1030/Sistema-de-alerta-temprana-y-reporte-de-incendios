import UsuarioRepository from "../../../../application/usuario/repositories/usuario.repository.js";
import { conUsuarioActual } from "../../../prismaConfig/conUsuarioActual.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export default class PrismaUsuarioRepository extends UsuarioRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  // id_usuario_actor: quien queda registrado como autor de la creacion (ver
  // conUsuarioActual.js). null en autoregistro publico, donde no hay sesion.
  async create(usuarioData, id_usuario_actor = null) {
    return conUsuarioActual(this.prisma, id_usuario_actor, (tx) =>
      tx.usuario.create({
        data: {
          id_rol: usuarioData.id_rol,
          id_institucion: usuarioData.id_institucion,
          nombre: usuarioData.nombre,
          telefono: usuarioData.telefono,
          contrasena: usuarioData.contrasena,
          correo: usuarioData.correo,
          primer_apellido: usuarioData.primer_apellido,
          segundo_apellido: usuarioData.segundo_apellido,
        },
        include: { rol: { select: { nombre_rol: true } } },
      })
    );
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.id_institucion) where.id_institucion = Number(filters.id_institucion);
    if (!filters.incluirEliminados || filters.incluirEliminados === "false") {
      where.fecha_eliminacion = null;
    }

    return await this.prisma.usuario.findMany({
      where,
      orderBy: { id_usuario: "asc" },
      include: { rol: { select: { nombre_rol: true } } },
    });
  }

  async findById(id) {
    return await this.prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
      include: { rol: { select: { nombre_rol: true } } },
    });
  }

  async findByInstitucionAndRol(id_institucion, nombre_rol) {
    return await this.prisma.usuario.findMany({
      where: {
        id_institucion: Number(id_institucion),
        fecha_eliminacion: null,
        estado: true,
        rol: { nombre_rol },
      },
      orderBy: { id_usuario: "asc" },
      include: { rol: { select: { nombre_rol: true } } },
    });
  }

  // id_usuario_actor es quien queda registrado en auditoriau por
  // trg_escalada_privilegios si esta llamada cambia id_rol (ver
  // conUsuarioActual.js). Sin cambio de id_rol el trigger no hace nada,
  // pero igual conviene fijarlo siempre: es barato y evita el caso donde
  // el llamador no sabe de antemano si datos.id_rol difiere del actual.
  async update(id, usuarioData, id_usuario_actor = null) {
    return conUsuarioActual(this.prisma, id_usuario_actor, (tx) =>
      tx.usuario.update({
        where: { id_usuario: Number(id) },
        data: limpiar({
          id_rol: usuarioData.id_rol,
          id_institucion: usuarioData.id_institucion,
          nombre: usuarioData.nombre,
          telefono: usuarioData.telefono,
          correo: usuarioData.correo,
          contrasena: usuarioData.contrasena,
          primer_apellido: usuarioData.primer_apellido,
          segundo_apellido: usuarioData.segundo_apellido,
        }),
        include: { rol: { select: { nombre_rol: true } } },
      })
    );
  }

  async desactivar(id, id_usuario_actor = null) {
    return conUsuarioActual(this.prisma, id_usuario_actor, (tx) =>
      tx.usuario.update({
        where: { id_usuario: Number(id) },
        data: { fecha_eliminacion: new Date(), estado: false },
        include: { rol: { select: { nombre_rol: true } } },
      })
    );
  }

  async reactivar(id, id_usuario_actor = null) {
    return conUsuarioActual(this.prisma, id_usuario_actor, (tx) =>
      tx.usuario.update({
        where: { id_usuario: Number(id) },
        data: { fecha_eliminacion: null, estado: true },
        include: { rol: { select: { nombre_rol: true } } },
      })
    );
  }

  // Devuelve el contador ya incrementado para que el caller decida si llego
  // al umbral de la politica del rol, sin una lectura previa por separado.
  async incrementarIntentosFallidos(id) {
    const usuario = await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { intentos_fallidos: { increment: 1 } },
      select: { intentos_fallidos: true },
    });
    return usuario.intentos_fallidos;
  }

  async resetearIntentos(id) {
    await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { intentos_fallidos: 0 },
    });
  }

  async bloquear(id, bloqueado_hasta) {
    await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { bloqueado_hasta, intentos_fallidos: 0 },
    });
  }

  async guardarSecretoMfa(id, mfa_secreto) {
    await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { mfa_secreto, mfa_habilitado: false },
    });
  }

  async habilitarMfa(id) {
    await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { mfa_habilitado: true },
    });
  }
}
