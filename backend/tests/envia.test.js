import test from 'node:test';
import assert from 'node:assert/strict';
import PrismaEnviaRepository from '../api/infrastructure/features/envia/repositories/envia.repository.impl.js';

// Fake minimo de Prisma: solo lo que usa PrismaEnviaRepository#updateEstado.
function fakeDb({ envioActual, institucionDelUsuario = 3n } = {}) {
  const llamadas = { recepcionaUpdateMany: [], alertaUpdateMany: [] };
  const db = {
    $queryRaw: async () => [],
    lectura: { findFirst: async () => null },
    envia: {
      findUnique: async () => envioActual,
      update: async ({ data }) => ({ ...envioActual, ...data }),
    },
    alerta: {
      updateMany: async (args) => { llamadas.alertaUpdateMany.push(args); return { count: 1 }; },
      findUnique: async () => ({ id_alerta: envioActual.id_alerta, estado: 'ATENDIDA' }),
    },
    recepciona: {
      updateMany: async (args) => { llamadas.recepcionaUpdateMany.push(args); return { count: 1 }; },
    },
  };
  const prisma = { $transaction: async (fn) => fn(db) };
  return { prisma, llamadas };
}

test('Envia cerrar: libera a los operativos de ESA institucion asignados a la alerta', async () => {
  const envioActual = { id_alerta: 7n, id_institucion: 3n, estado: 'ATENDIDA' };
  const { prisma, llamadas } = fakeDb({ envioActual });
  const repo = new PrismaEnviaRepository(prisma);

  await repo.updateEstado(7, 3, 'CERRADA');

  assert.equal(llamadas.recepcionaUpdateMany.length, 1);
  const [{ where, data }] = llamadas.recepcionaUpdateMany;
  assert.equal(where.id_alerta, 7n);
  assert.equal(where.estado, 'ASIGNADO');
  assert.equal(where.usuario.id_institucion, 3n);
  assert.equal(data.estado, 'LIBERADO');
  assert.ok(data.fecha_liberacion instanceof Date);
  // Cerrar el envio de una institucion no cierra la alerta global.
  assert.equal(llamadas.alertaUpdateMany.length, 0);
});

test('Envia atender: actualiza la alerta a ATENDIDA pero no toca recepciona', async () => {
  const envioActual = { id_alerta: 7n, id_institucion: 3n, estado: 'RECIBIDA' };
  const { prisma, llamadas } = fakeDb({ envioActual });
  const repo = new PrismaEnviaRepository(prisma);

  await repo.updateEstado(7, 3, 'ATENDIDA');

  assert.equal(llamadas.alertaUpdateMany.length, 1);
  assert.equal(llamadas.recepcionaUpdateMany.length, 0);
});

test('Envia: transicion invalida (p. ej. ENVIADA directo a CERRADA) se rechaza', async () => {
  const envioActual = { id_alerta: 7n, id_institucion: 3n, estado: 'ENVIADA' };
  const { prisma } = fakeDb({ envioActual });
  const repo = new PrismaEnviaRepository(prisma);

  await assert.rejects(repo.updateEstado(7, 3, 'CERRADA'), /Transicion no permitida/);
});
