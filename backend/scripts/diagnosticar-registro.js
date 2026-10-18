import 'dotenv/config';
import prisma from '../api/infrastructure/prismaConfig/prismaClient.js';
import PrismaAuthRepository from '../api/infrastructure/features/auth/repositories/auth.repository.impl.js';

// Ejecutar desde backend, dentro del proceso/contenedor y entorno del despliegue.
// Usa la configuracion existente; nunca imprime DATABASE_URL ni contrasenas.
const correo = process.argv[2];
try {
  if (!correo || !correo.trim() || process.argv.length !== 3) {
    throw new Error('Uso: node scripts/diagnosticar-registro.js correo@ejemplo.com');
  }
  const resultado = await prisma.$transaction(async (tx) => {
    // PostgreSQL impide escrituras incluso si el repositorio cambiara accidentalmente.
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const [entorno] = await tx.$queryRaw`
      SELECT current_database() AS base, current_schema() AS esquema,
             current_user AS usuario_bd, current_setting('transaction_read_only') AS solo_lectura
    `;
    const encontrado = await new PrismaAuthRepository(tx).findByCorreo(correo);
    const filas = await tx.$queryRaw`
      SELECT id_usuario, estado, fecha_eliminacion,
             lower(correo) = lower(${correo}) AS coincide_sin_recortar
      FROM usuario WHERE lower(trim(correo)) = lower(trim(${correo}))
    `;
    return {
      entorno,
      repositorio: {
        rechazaria_por_duplicado: Boolean(encontrado),
        tipo_retorno: encontrado === null ? 'null' : Array.isArray(encontrado) ? 'array' : typeof encontrado,
        id_usuario: encontrado?.id_usuario == null ? null : String(encontrado.id_usuario),
        coincide_correo: typeof encontrado?.correo === 'string'
          ? encontrado.correo.toLowerCase() === correo.toLowerCase() : null,
        estado: encontrado?.estado ?? null,
        eliminado: encontrado?.fecha_eliminacion != null,
      },
      coincidencias_sql_incluyendo_eliminados: filas.map((u) => ({
        id_usuario: String(u.id_usuario), estado: u.estado,
        eliminado: u.fecha_eliminacion != null,
        coincide_sin_recortar: u.coincide_sin_recortar,
      })),
    };
  }, { isolationLevel: 'RepeatableRead', timeout: 15000 });
  console.log(JSON.stringify(resultado, null, 2));
} catch (error) {
  // No imprimir el error completo de conexion: puede contener datos de acceso.
  console.error('No se pudo completar el diagnostico. Verifica el argumento, el directorio backend y la configuracion de conexion del proceso.');
  console.error('Tipo:', error.name, 'Codigo:', error.code ?? 'NO_DISPONIBLE');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
