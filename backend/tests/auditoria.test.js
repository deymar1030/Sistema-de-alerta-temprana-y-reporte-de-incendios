import test from 'node:test';
import assert from 'node:assert/strict';
import GetAllAuditoriaUseCase from '../api/application/auditoria/useCases/getAllAuditoria.useCase.js';
import GetAllAuditoriaUsuarioUseCase from '../api/application/auditoria/useCases/getAllAuditoriaUsuario.useCase.js';

test('Auditoria: getAll reenvia los filtros tal cual al repositorio (solo lectura)', async () => {
  let recibidos;
  const repo = { findAll: async (filters) => { recibidos = filters; return [{ id_auditoria: 1n, evento: 'LOGIN', fecha_hora: new Date(), detalle: null }]; } };
  const useCase = new GetAllAuditoriaUseCase(repo);
  const filtros = { evento: 'LOGIN', desde: '2026-01-01', hasta: '2026-01-31' };
  const result = await useCase.execute(filtros);
  assert.deepEqual(recibidos, filtros);
  assert.equal(result.length, 1);
});

test('Auditoria: getAllUsuario reenvia los filtros tal cual al repositorio', async () => {
  let recibidos;
  const repo = { findAllUsuario: async (filters) => { recibidos = filters; return []; } };
  const useCase = new GetAllAuditoriaUsuarioUseCase(repo);
  const filtros = { id_usuario: 7, accion: 'EDITAR_USUARIO' };
  await useCase.execute(filtros);
  assert.deepEqual(recibidos, filtros);
});

test('Auditoria: el repositorio base no implementa escritura (solo findAll/findAllUsuario)', async () => {
  const AuditoriaRepository = (await import('../api/application/auditoria/repositories/auditoria.repository.js')).default;
  const repo = new AuditoriaRepository();
  assert.equal(typeof repo.create, 'undefined');
  assert.equal(typeof repo.update, 'undefined');
  assert.equal(typeof repo.delete, 'undefined');
  await assert.rejects(repo.findAll({}), /not implemented/);
});
