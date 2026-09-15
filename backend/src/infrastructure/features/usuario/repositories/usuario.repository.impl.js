import UsuarioRepository from "../../../../application/usuario/repositories/usuario.repository.js";

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
        multiF_S: usuarioData.multiF_S,
        multiF_A: usuarioData.multiF_A,
        contrasena: usuarioData.contrasena,
        correo: usuarioData.correo,
        primer_apellido: usuarioData.primer_apellido,
        segundo_apellido: usuarioData.segundo_apellido,
      },
    });
  }

  async findAll() {
    return await this.prisma.usuario.findMany({
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
      data: {
        id_rol: usuarioData.id_rol,
        id_institucion: usuarioData.id_institucion,
        nombre: usuarioData.nombre,
        telefono: usuarioData.telefono,
        multiF_S: usuarioData.multiF_S,
        multiF_A: usuarioData.multiF_A,
        contrasena: usuarioData.contrasena,
        correo: usuarioData.correo,
        primer_apellido: usuarioData.primer_apellido,
        segundo_apellido: usuarioData.segundo_apellido,
      },
    });
  }

  async delete(id) {
    return await this.prisma.usuario.delete({
      where: { id_usuario: Number(id) },
    });
  }
}
