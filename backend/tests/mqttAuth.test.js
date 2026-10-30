import test from 'node:test';
import assert from 'node:assert/strict';
import { Hash } from '../api/config/hash.js';
import VerificarCredencialPredioUseCase from '../api/application/mqttAuth/useCases/verificarCredencialPredio.useCase.js';
import VerificarPublicacionSensorUseCase from '../api/application/mqttAuth/useCases/verificarPublicacionSensor.useCase.js';

const backend = { username: 'backend', password: 'clave-secreta-del-backend' };

test('auth: predio con password correcta autentica, incorrecta no', async () => {
  const hash = await Hash.hash('clave-del-predio');
  const repo = { findById: async (id) => (id === '10' ? { id_predio: 10, contrasena_mqtt: hash } : null) };
  const useCase = new VerificarCredencialPredioUseCase(repo, backend);
  assert.equal(await useCase.execute({ username: 'predio-10', password: 'clave-del-predio' }), true);
  assert.equal(await useCase.execute({ username: 'predio-10', password: 'otra' }), false);
});

test('auth: predio inexistente o sin contrasena_mqtt no autentica', async () => {
  const repo = { findById: async () => null };
  const useCase = new VerificarCredencialPredioUseCase(repo, backend);
  assert.equal(await useCase.execute({ username: 'predio-999', password: 'cualquiera' }), false);

  const repoSinPassword = { findById: async () => ({ id_predio: 11, contrasena_mqtt: null }) };
  const useCaseSinPassword = new VerificarCredencialPredioUseCase(repoSinPassword, backend);
  assert.equal(await useCaseSinPassword.execute({ username: 'predio-11', password: 'x' }), false);
});

test('auth: username invalido o password ausente no autentica', async () => {
  const repo = { findById: async () => { throw new Error('no debe consultarse'); } };
  const useCase = new VerificarCredencialPredioUseCase(repo, backend);
  assert.equal(await useCase.execute({ username: 'otro-usuario', password: 'x' }), false);
  assert.equal(await useCase.execute({ username: 'predio-10', password: undefined }), false);
  assert.equal(await useCase.execute({ username: undefined, password: 'x' }), false);
});

test('auth: identidad backend valida con su propia credencial, no con la de un predio', async () => {
  const repo = { findById: async () => { throw new Error('no debe consultarse'); } };
  const useCase = new VerificarCredencialPredioUseCase(repo, backend);
  assert.equal(await useCase.execute({ username: 'backend', password: 'clave-secreta-del-backend' }), true);
  assert.equal(await useCase.execute({ username: 'backend', password: 'incorrecta' }), false);
});

test('auth: sin credencial de backend configurada, el usuario "backend" no tiene atajo', async () => {
  const hash = await Hash.hash('x');
  const repo = { findById: async () => ({ id_predio: 1, contrasena_mqtt: hash }) };
  const useCase = new VerificarCredencialPredioUseCase(repo, { username: '', password: '' });
  assert.equal(await useCase.execute({ username: 'backend', password: 'x' }), false);
});

test('acl: predio solo puede escribir en sus propios sensores activos', async () => {
  const repo = {
    findSensores: async (id_predio) =>
      id_predio === '10' ? [{ id_sensor: 31, estado: 'ACTIVO' }, { id_sensor: 32, estado: 'INACTIVO' }] : [],
  };
  const useCase = new VerificarPublicacionSensorUseCase(repo, 'backend');
  assert.equal(await useCase.execute({ username: 'predio-10', topic: 'incendios/10/31', acc: 2 }), true);
  assert.equal(await useCase.execute({ username: 'predio-10', topic: 'incendios/10/32', acc: 2 }), false);
  assert.equal(await useCase.execute({ username: 'predio-10', topic: 'incendios/11/31', acc: 2 }), false);
  assert.equal(await useCase.execute({ username: 'predio-10', topic: 'incendios/10/31', acc: 1 }), false);
});

test('acl: backend puede leer/suscribirse a incendios/+/+ pero nunca escribir', async () => {
  const repo = { findSensores: async () => { throw new Error('no debe consultarse'); } };
  const useCase = new VerificarPublicacionSensorUseCase(repo, 'backend');
  assert.equal(await useCase.execute({ username: 'backend', topic: 'incendios/+/+', acc: 4 }), true);
  assert.equal(await useCase.execute({ username: 'backend', topic: 'incendios/10/31', acc: 1 }), true);
  assert.equal(await useCase.execute({ username: 'backend', topic: 'incendios/10/31', acc: 2 }), false);
  assert.equal(await useCase.execute({ username: 'backend', topic: 'otro/10/31', acc: 1 }), false);
});

test('acl: un predio no puede hacerse pasar por backend', async () => {
  const repo = { findSensores: async () => [] };
  const useCase = new VerificarPublicacionSensorUseCase(repo, 'backend');
  assert.equal(await useCase.execute({ username: 'predio-10', topic: 'incendios/+/+', acc: 4 }), false);
});
