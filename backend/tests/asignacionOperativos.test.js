import test from 'node:test';
import assert from 'node:assert/strict';
import AsignarAlertaOperativosUseCase from '../api/application/notificacion/useCases/asignarAlertaOperativos.useCase.js';

const jefe = { id_usuario: 1n, id_institucion: 10n, nombre: 'Ana', primer_apellido: 'Perez' };
const operativos = [{ id_usuario: 2n }, { id_usuario: 3n }];

function buildUseCase({ asignacionesActivas = [], yaAsignadaAntes = false, idsCiudadanos = [] } = {}) {
  const asignados = [];
  const notificaciones = [];
  const useCase = new AsignarAlertaOperativosUseCase({
    notificacionRepository: {
      createMany: async (data) => { notificaciones.push(...data); return data.map((d, i) => ({ id_notificacion: notificaciones.length - data.length + i + 1, ...d })); },
    },
    usuarioRepository: { findByInstitucionAndRol: async () => operativos },
    enviaRepository: { findByIds: async () => ({ id_alerta: 5, id_institucion: 10 }) },
    recepcionaRepository: {
      findAsignacionesActivas: async () => asignacionesActivas,
      existeAsignacionParaAlerta: async () => yaAsignadaAntes,
      asignar: async (id_alerta, ids) => { asignados.push({ id_alerta, ids }); },
    },
    reporteURepository: { findCiudadanosByAlerta: async () => idsCiudadanos },
    realtimeNotifier: { emitNotificacion: async () => {} },
  });
  return { useCase, asignados, notificaciones };
}

test('Asignacion: operativo sin compromisos activos se asigna y notifica', async () => {
  const { useCase, asignados, notificaciones } = buildUseCase();
  const result = await useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe });
  assert.equal(asignados.length, 1);
  assert.deepEqual(asignados[0].ids, [2, 3]);
  assert.equal(notificaciones.length, 2);
  assert.equal(result.length, 2);
});

test('Asignacion: operativo ya ASIGNADO a otra alerta activa se rechaza sin notificar', async () => {
  const { useCase, asignados, notificaciones } = buildUseCase({
    asignacionesActivas: [{ id_usuario: 3n, id_alerta: 99n }],
  });
  await assert.rejects(
    useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe }),
    /ya asignado\(s\) a otra alerta activa/
  );
  assert.equal(asignados.length, 0);
  assert.equal(notificaciones.length, 0);
});

test('Asignacion: reasignar al mismo operativo a la MISMA alerta es idempotente', async () => {
  const { useCase, asignados } = buildUseCase({
    asignacionesActivas: [{ id_usuario: 2n, id_alerta: 5n }],
  });
  await useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe });
  assert.equal(asignados.length, 1);
  assert.deepEqual(asignados[0].ids, [2, 3]);
});

test('Asignacion: primera vez que la alerta recibe operativos avisa a quien la reporto', async () => {
  const { useCase, notificaciones } = buildUseCase({ yaAsignadaAntes: false, idsCiudadanos: [50] });
  await useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe });
  // 2 notificaciones de "alerta asignada" para los operativos + 1 para el ciudadano.
  assert.equal(notificaciones.length, 3);
  const aviso = notificaciones.find((n) => n.id_usuario === 50);
  assert.equal(aviso.tipo, 'REPORTE');
});

test('Asignacion: si la alerta YA tenia operativos asignados, no se repite el aviso al ciudadano', async () => {
  const { useCase, notificaciones } = buildUseCase({ yaAsignadaAntes: true, idsCiudadanos: [50] });
  await useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe });
  assert.equal(notificaciones.length, 2);
  assert.equal(notificaciones.some((n) => n.id_usuario === 50), false);
});

test('Asignacion: alerta sin reporte ciudadano (nacida de sensor) no genera aviso de mas', async () => {
  const { useCase, notificaciones } = buildUseCase({ yaAsignadaAntes: false, idsCiudadanos: [] });
  await useCase.execute({ id_alerta: 5, id_usuarios: [2, 3], jefe });
  assert.equal(notificaciones.length, 2);
});
