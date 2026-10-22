import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import RegisterUseCase from '../api/application/auth/useCases/register.useCase.js';
import { AuthController } from '../api/interfaces/features/authRoter/controller.js';
import { Hash } from '../api/config/hash.js';

// Contrato HTTP con controlador y caso de uso reales; persistencia aislada en memoria.
// No registra usuarios ni cambia roles en la BD configurada o en el servidor remoto.
const body = {
  nombre: 'Santiago Ignacio', primer_apellido: 'Mejia', segundo_apellido: 'Barrancos',
  telefono: '1234567', correo: 'correo_nuevo@gmail.com', contrasena: '12345678',
};

async function iniciar(t) {
  const usuarios = [];
  let consultas = 0;
  const useCase = new RegisterUseCase({
    authRepository: { findByCorreo: async (correo) => {
      consultas++;
      return usuarios.find((u) => u.correo.toLowerCase() === correo.toLowerCase()) ?? null;
    } },
    rolRepository: { findOrCreateByNombre: async (nombre) => {
      assert.equal(nombre, 'CIUDADANO');
      return { id_rol: 5 };
    } },
    usuarioRepository: { create: async (data) => {
      const usuario = { ...data, id_usuario: usuarios.length + 1, estado: true, fecha_eliminacion: null };
      usuarios.push(usuario);
      return usuario;
    } },
  });
  const controller = new AuthController({ register: (data) => useCase.execute(data) });
  const app = express();
  app.use(express.json());
  app.post('/api/auth/register', controller.register);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  t.after(() => new Promise((resolve, reject) => server.close((e) => e ? reject(e) : resolve())));
  return {
    usuarios,
    consultas: () => consultas,
    enviar: async (data) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      return { status: response.status, cookie: response.headers.get('set-cookie'), body: await response.json() };
    },
  };
}

test('Registro acepta el body de Santiago, conserva apellidos y no expone contrasena ni crea sesion', async (t) => {
  const api = await iniciar(t);
  const r = await api.enviar(body);
  assert.equal(r.status, 201);
  assert.equal(r.body.success, true);
  for (const campo of ['nombre', 'primer_apellido', 'segundo_apellido', 'telefono', 'correo']) {
    assert.equal(r.body.data[campo], body[campo]);
  }
  assert.equal(r.body.data.id_rol, 5);
  assert.equal(r.body.data.id_institucion, null);
  assert.equal(Object.hasOwn(r.body.data, 'contrasena'), false);
  assert.equal(r.cookie, null);
  assert.notEqual(api.usuarios[0].contrasena, body.contrasena);
  assert.equal(await Hash.compare(body.contrasena, api.usuarios[0].contrasena), true);
});

test('Registro distingue correo existente de otro nuevo; duplicado devuelve 409', async (t) => {
  const api = await iniciar(t);
  assert.equal((await api.enviar(body)).status, 201);
  const duplicado = await api.enviar({ ...body, correo: body.correo.toUpperCase() });
  assert.equal(duplicado.status, 409);
  assert.equal(duplicado.body.code, 'CORREO_YA_REGISTRADO');
  assert.equal((await api.enviar({ ...body, correo: 'otro_nuevo@example.test' })).status, 201);
  assert.equal(api.usuarios.length, 2);
});

test('Registro sin correo devuelve validacion antes de consultar coincidencias', async (t) => {
  const api = await iniciar(t);
  const { correo, ...incompleto } = body;
  const r = await api.enviar(incompleto);
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'VALIDATION_ERROR');
  assert.equal(api.consultas(), 0);
  assert.equal(api.usuarios.length, 0);
});

test('Registro publico no permite elegir rol o institucion desde el body', async (t) => {
  const api = await iniciar(t);
  const r = await api.enviar({ ...body, id_rol: 1, role: 'ADMIN', id_institucion: 99 });
  assert.equal(r.status, 201);
  assert.equal(api.usuarios[0].id_rol, 5);
  assert.equal(api.usuarios[0].id_institucion, null);
});
