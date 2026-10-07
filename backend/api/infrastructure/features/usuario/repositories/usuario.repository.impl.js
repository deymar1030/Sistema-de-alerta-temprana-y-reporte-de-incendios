import UsuarioRepository from "../../../../application/usuario/repositories/usuario.repository.js";

function limpiar(data) {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export default class PrismaUsuarioRepository extends UsuarioRepository {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async create(usuarioData) {
    return await this.prisma.usuario.create({
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
    });
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
    });
  }

  async findById(id) {
    return await this.prisma.usuario.findUnique({
      where: { id_usuario: Number(id) },
    });
  }

  async update(id, usuarioData) {
    return await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: limpiar({
        id_rol: usuarioData.id_rol,
        id_institucion: usuarioData.id_institucion,
        nombre: usuarioData.nombre,
        telefono: usuarioData.telefono,
        correo: usuarioData.correo,
        primer_apellido: usuarioData.primer_apellido,
        segundo_apellido: usuarioData.segundo_apellido,
      }),
    });
  }

  async desactivar(id) {
    return await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { fecha_eliminacion: new Date() },
    });
  }

  async reactivar(id) {
    return await this.prisma.usuario.update({
      where: { id_usuario: Number(id) },
      data: { fecha_eliminacion: null },
    });
  }
}
