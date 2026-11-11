import test from 'node:test';
import assert from 'node:assert/strict';
import CreateInformeAtencionUseCase from '../api/application/informeAtencion/useCases/createInformeAtencion.useCase.js';
import UpdateInformeAtencionUseCase from '../api/application/informeAtencion/useCases/updateInformeAtencion.useCase.js';

const base = { id_alerta: 7, id_institucion: 10, id_usuario: 1 };

// Fakes comunes para reporteURepository/notificacionRepository/realtimeNotifier:
// por defecto no hay ciudadanos que avisar, asi que notificarCierreAlerta no
// hace nada mas alla del emitAlertaActualizada. idsCiudadanos permite probar
// el aviso cuando la alerta SI nacio de un reporte.
function buildDeps(informeAtencionRepository, { idsCiudadanos = [] } = {}) {
  const emitidas = [];
  const notificacionesCiudadano = [];
  return {
    deps: {
      informeAtencionRepository,
      reporteURepository: { findCiudadanosByAlerta: async () => idsCiudadanos },
      notificacionRepository: {
        createMany: async (data) => { notificacionesCiudadano.push(...data); return data.map((d, i) => ({ id_notificacion: i + 1, ...d })); },
      },
      realtimeNotifier: {
        emitAlertaActualizada: async (alerta) => { emitidas.push(alerta); },
        emitNotificacion: async () => {},
      },
    },
    emitidas,
    notificacionesCiudadano,
  };
}

test('InformeAtencion crear: BORRADOR no cierra la alerta', async () => {
  let evaluoCierre = false;
  const repo = {
    crearYEvaluarCierre: async (data) => {
      evaluoCierre = data.estado === 'COMPLETADO';
      return { informe: { id_informe_atencion: 1, ...data }, alerta_actualizada: null };
    },
  };
  const { deps, emitidas } = buildDeps(repo);
  const useCase = new CreateInformeAtencionUseCase(deps);
  const informe = await useCase.execute({ ...base, estado: 'BORRADOR' });
  assert.equal(evaluoCierre, false);
  assert.equal(informe.estado, 'BORRADOR');
  assert.equal(emitidas.length, 0);
});

test('InformeAtencion crear: COMPLETADO delega el cierre atomico al repositorio y avisa a quien reporto', async () => {
  let recibido;
  const repo = {
    crearYEvaluarCierre: async (data) => { recibido = data; return { informe: { id_informe_atencion: 2, ...data }, alerta_actualizada: { id_alerta: 7, estado: 'CERRADA' } }; },
  };
  const { deps, emitidas, notificacionesCiudadano } = buildDeps(repo, { idsCiudadanos: [50] });
  const useCase = new CreateInformeAtencionUseCase(deps);
  await useCase.execute({ ...base, estado: 'COMPLETADO' });
  assert.equal(recibido.estado, 'COMPLETADO');
  assert.equal(emitidas.length, 1);
  assert.equal(emitidas[0].estado, 'CERRADA');
  assert.equal(notificacionesCiudadano.length, 1);
  assert.equal(notificacionesCiudadano[0].id_usuario, 50);
  assert.equal(notificacionesCiudadano[0].tipo, 'ALERTA');
});

test('InformeAtencion actualizar: rechaza modificar un informe de otra institucion', async () => {
  const repo = { findById: async () => ({ id_informe_atencion: 3, id_alerta: 7, id_institucion: 10, estado: 'BORRADOR' }) };
  const { deps } = buildDeps(repo);
  const useCase = new UpdateInformeAtencionUseCase(deps);
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
  const { deps, emitidas } = buildDeps(repo);
  const useCase = new UpdateInformeAtencionUseCase(deps);
  await useCase.execute(4, { estado: 'COMPLETADO' }, { id_institucion: 10 });
  assert.equal(llamadas[0].yaCompletado, false);
  assert.equal(llamadas[0].id_alerta, 7);
  assert.equal(emitidas.length, 1);
});

test('InformeAtencion actualizar: ya COMPLETADO no reabre ni recierra', async () => {
  const llamadas = [];
  const repo = {
    findById: async () => ({ id_informe_atencion: 5, id_alerta: 7, id_institucion: 10, estado: 'COMPLETADO' }),
    actualizarYEvaluarCierre: async (id, data, ctx) => { llamadas.push(ctx); return { informe: { id_informe_atencion: id, ...data }, alerta_actualizada: null }; },
  };
  const { deps, emitidas } = buildDeps(repo);
  const useCase = new UpdateInformeAtencionUseCase(deps);
  await useCase.execute(5, { estado: 'COMPLETADO', observaciones: 'actualizado' }, { id_institucion: 10 });
  assert.equal(llamadas[0].yaCompletado, true);
  assert.equal(emitidas.length, 0);
});
