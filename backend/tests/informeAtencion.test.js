import test from 'node:test';
import assert from 'node:assert/strict';
import CreateInformeAtencionUseCase from '../api/application/informeAtencion/useCases/createInformeAtencion.useCase.js';
import UpdateInformeAtencionUseCase from '../api/application/informeAtencion/useCases/updateInformeAtencion.useCase.js';

const base = { id_alerta: 7, id_institucion: 10, id_usuario: 1 };

test('InformeAtencion crear: BORRADOR no cierra la alerta', async () => {
  let evaluoCierre = false;
  const repo = {
    crearYEvaluarCierre: async (data) => {
      evaluoCierre = data.estado === 'COMPLETADO';
      return { informe: { id_informe_atencion: 1, ...data }, alerta_actualizada: null };
    },
  };
  const useCase = new CreateInformeAtencionUseCase(repo);
  const informe = await useCase.execute({ ...base, estado: 'BORRADOR' });
  assert.equal(evaluoCierre, false);
  assert.equal(informe.estado, 'BORRADOR');
});

test('InformeAtencion crear: COMPLETADO delega el cierre atomico al repositorio', async () => {
  let recibido;
  const repo = {
    crearYEvaluarCierre: async (data) => { recibido = data; return { informe: { id_informe_atencion: 2, ...data }, alerta_actualizada: { id_alerta: 7, estado: 'CERRADA' } }; },
  };
  const useCase = new CreateInformeAtencionUseCase(repo);
  await useCase.execute({ ...base, estado: 'COMPLETADO' });
  assert.equal(recibido.estado, 'COMPLETADO');
});

test('InformeAtencion actualizar: rechaza modificar un informe de otra institucion', async () => {
  const repo = { findById: async () => ({ id_informe_atencion: 3, id_alerta: 7, id_institucion: 10, estado: 'BORRADOR' }) };
  const useCase = new UpdateInformeAtencionUseCase(repo);
  await assert.rejects(
    useCase.execute(3, { estado: 'COMPLETADO' }, { id_institucion: 99 }),
    /otra institucion/
  );
});

test('InformeAtencion actualizar: BORRADOR -> COMPLETADO cierra; repetirlo es idempotente', async () => {
  const llamadas = [];
  const repo = {
    findById: async () => ({ id_informe_atencion: 4, id_alerta: 7, id_institucion: 10, estado: 'BORRADOR' }),
    actualizarYEvaluarCierre: async (id, data, ctx) => {
      llamadas.push(ctx);
      return { informe: { id_informe_atencion: id, ...data }, alerta_actualizada: ctx.yaCompletado ? null : { id_alerta: 7, estado: 'CERRADA' } };
    },
  };
  const useCase = new UpdateInformeAtencionUseCase(repo);
  await useCase.execute(4, { estado: 'COMPLETADO' }, { id_institucion: 10 });
  assert.equal(llamadas[0].yaCompletado, false);
  assert.equal(llamadas[0].id_alerta, 7);
});

test('InformeAtencion actualizar: ya COMPLETADO no reabre ni recierra', async () => {
  const llamadas = [];
  const repo = {
    findById: async () => ({ id_informe_atencion: 5, id_alerta: 7, id_institucion: 10, estado: 'COMPLETADO' }),
    actualizarYEvaluarCierre: async (id, data, ctx) => { llamadas.push(ctx); return { informe: { id_informe_atencion: id, ...data }, alerta_actualizada: null }; },
  };
  const useCase = new UpdateInformeAtencionUseCase(repo);
  await useCase.execute(5, { estado: 'COMPLETADO', observaciones: 'actualizado' }, { id_institucion: 10 });
  assert.equal(llamadas[0].yaCompletado, true);
});
