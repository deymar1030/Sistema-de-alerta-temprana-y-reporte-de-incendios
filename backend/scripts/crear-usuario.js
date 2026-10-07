// Crea un usuario con la contrasena hasheada. Sirve para el primer usuario,
// ya que las rutas estan protegidas y POST /api/usuarios exige sesion.
// Uso: npm run crear-usuario -- <correo> <contrasena> [nombre]
import "dotenv/config";
import prisma from "../api/infrastructure/prismaConfig/prismaClient.js";
import { Hash } from "../api/config/hash.js";

const [correo, contrasena, nombre = "Administrador", primer_apellido = "Sistema"] = process.argv.slice(2);

if (!correo || !contrasena) {
  console.error("Uso: npm run crear-usuario -- <correo> <contrasena> [nombre] [primer_apellido]");
  process.exit(1);
}

if (contrasena.length < 8) {
  console.error("La contrasena debe tener al menos 8 caracteres.");
  process.exit(1);
}

try {
  const existente = await prisma.usuario.findFirst({
    where: { correo: { equals: correo, mode: "insensitive" } },
  });

  if (existente) {
    console.error(`Ya existe un usuario con el correo ${correo}.`);
    process.exit(1);
  }

  const rol =
    (await prisma.rol.findUnique({ where: { nombre_rol: "ADMIN" } })) ??
    (await prisma.rol.create({ data: { nombre_rol: "ADMIN" } }));

  const usuario = await prisma.usuario.create({
    data: { correo, nombre, primer_apellido, id_rol: rol.id_rol, contrasena: await Hash.hash(contrasena) },
  });

  console.log(`Usuario creado: id ${usuario.id_usuario} (${usuario.correo})`);
} finally {
  await prisma.$disconnect();
}
