import test from 'node:test';
import assert from 'node:assert/strict';
import CreateReporteUUseCase from '../api/application/reporteU/useCases/createReporteU.useCase.js';
import { sugerirNivelPrioridad } from '../api/domain/deteccionImagen/sugerirNivelPrioridad.js';
const data = { id_usuario: '1', descripcion: 'Prueba', foto_url: '/api/archivos/reportes-usuario/prueba.png' };
const high = { detected: true, fire_probability: .95, warning: null };

test('Vision: confirmacion atomica y eventos solo despues del commit', async () => {
  let committed = false, creates = 0;
  const useCase = new CreateReporteUUseCase({
    reporteURepository: { create() { throw Error('No debe guardar por separado'); } },
    clasificadorImagenRepository: { classify: async () => high },
    alertaDesdeReporteRepository: { crearReporteConAlerta: async ({ reporteU }) => {
      creates++; committed = true;
      return { reporteU: { ...reporteU, id_reporte_u: 1n }, alerta: { id_alerta: 2n, fecha: new Date(), hora: new Date(), estado: 'CONFIRMADA' }, envios: [], notificaciones: [] };
    } },
    realtimeNotifier: { emitReporteCiudadano() { assert.ok(committed); }, emitAlertaConfirmada() { assert.ok(committed); } },
  });
  const result = await useCase.execute(data);
  assert.equal(creates, 1); assert.equal(result.alerta_vinculada.id_alerta, 2n);
});

test('Vision: fallo de distribucion no se oculta ni publica un reporte incompleto', async () => {
  const useCase = new CreateReporteUUseCase({ reporteURepository: {},
    clasificadorImagenRepository: { classify: async () => high },
    alertaDesdeReporteRepository: { crearReporteConAlerta: async () => { throw Error('Fallo distribucion'); } },
    realtimeNotifier: { emitReporteCiudadano() { assert.fail('Emitio antes del commit'); } },
  });
  await assert.rejects(useCase.execute(data), /Fallo distribucion/);
});

test('Vision: servicio caido guarda reporte con estado explicito, no confirma incendio', async () => {
  const useCase = new CreateReporteUUseCase({ reporteURepository: { create: async (value) => value },
    clasificadorImagenRepository: { classify: async () => { throw Error('No disponible'); } },
    realtimeNotifier: { emitReporteCiudadano() { throw Error('Socket desconectado'); } },
  });
  const result = await useCase.execute({ ...data, nivel_prioridad: 'ALTA' });
  assert.match(result.indicador, /IA no disponible/);
  assert.equal(result.alerta_vinculada, undefined);
});

test('Vision: prioridad del ciudadano, valores invalidos y advertencia no confirman', () => {
  assert.equal(sugerirNivelPrioridad(null), null);
  for (const prediccion of [ { ...high, warning: 'Revisar' }, { ...high, fire_probability: Infinity }, { ...high, fire_probability: 2 } ]) {
    assert.notEqual(sugerirNivelPrioridad(prediccion), 'ALTA');
  }
});
