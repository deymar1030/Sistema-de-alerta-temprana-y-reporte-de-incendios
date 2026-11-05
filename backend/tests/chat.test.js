import test from 'node:test';
import assert from 'node:assert/strict';
import EnviarMensajeChatUseCase from '../api/application/chat/useCases/enviarMensajeChat.useCase.js';
import ListarMensajesChatUseCase from '../api/application/chat/useCases/listarMensajesChat.useCase.js';

const jefeBomberos = { id_usuario: 1, id_institucion: 10, institucion: { categoria: 'BOMBEROS' } };

test('Enviar: la categoria del canal CATEGORIA sale de la institucion del remitente, no del body', async () => {
  let recibido;
  const repo = { create: async (data) => { recibido = data; return { id_mensaje: 1, ...data }; } };
  const notifier = { emitMensajeChat: async () => {} };
  const useCase = new EnviarMensajeChatUseCase({ mensajeChatRepository: repo, realtimeNotifier: notifier });

  await useCase.execute({ tipo_canal: 'CATEGORIA', contenido: 'vamos en camino', remitente: jefeBomberos });

  assert.equal(recibido.categoria, 'BOMBEROS');
  assert.equal(recibido.id_institucion_emisor, 10);
});

test('Enviar: canal GLOBAL siempre guarda categoria null, sin importar la institucion', async () => {
  let recibido;
  const repo = { create: async (data) => { recibido = data; return { id_mensaje: 2, ...data }; } };
  const notifier = { emitMensajeChat: async () => {} };
  const useCase = new EnviarMensajeChatUseCase({ mensajeChatRepository: repo, realtimeNotifier: notifier });

  await useCase.execute({ tipo_canal: 'GLOBAL', contenido: 'tenemos 3 operativos libres', remitente: jefeBomberos });

  assert.equal(recibido.categoria, null);
});

test('Enviar: emite por websocket despues de persistir', async () => {
  const emitidos = [];
  const repo = { create: async (data) => ({ id_mensaje: 3, ...data }) };
  const notifier = { emitMensajeChat: async (mensaje) => emitidos.push(mensaje) };
  const useCase = new EnviarMensajeChatUseCase({ mensajeChatRepository: repo, realtimeNotifier: notifier });

  await useCase.execute({ tipo_canal: 'GLOBAL', contenido: 'hola', remitente: jefeBomberos });

  assert.equal(emitidos.length, 1);
  assert.equal(emitidos[0].contenido, 'hola');
});

test('Enviar: rechaza contenido vacio o tipo_canal invalido, sin tocar el repositorio', async () => {
  const repo = { create: async () => { throw new Error('no deberia llamarse'); } };
  const notifier = { emitMensajeChat: async () => {} };
  const useCase = new EnviarMensajeChatUseCase({ mensajeChatRepository: repo, realtimeNotifier: notifier });

  await assert.rejects(useCase.execute({ tipo_canal: 'GLOBAL', contenido: '   ', remitente: jefeBomberos }), /contenido/);
  await assert.rejects(useCase.execute({ tipo_canal: 'ALERTA', contenido: 'hola', remitente: jefeBomberos }), /tipo_canal/);
});

test('Enviar: usuario sin institucion no puede participar', async () => {
  const repo = { create: async () => { throw new Error('no deberia llamarse'); } };
  const notifier = { emitMensajeChat: async () => {} };
  const useCase = new EnviarMensajeChatUseCase({ mensajeChatRepository: repo, realtimeNotifier: notifier });

  await assert.rejects(
    useCase.execute({ tipo_canal: 'GLOBAL', contenido: 'hola', remitente: { id_usuario: 9, id_institucion: null } }),
    /institucion/
  );
});

test('Listar: pide el canal CATEGORIA de la propia institucion del que consulta', async () => {
  let recibido;
  const repo = { findByCanal: async (tipo_canal, categoria, filtros) => { recibido = { tipo_canal, categoria, filtros }; return []; } };
  const useCase = new ListarMensajesChatUseCase(repo);

  await useCase.execute({ tipo_canal: 'CATEGORIA', remitente: jefeBomberos, antes: '5', limite: '10' });

  assert.equal(recibido.categoria, 'BOMBEROS');
  assert.equal(recibido.filtros.antes, 5);
  assert.equal(recibido.filtros.limite, 10);
});

test('Listar: limite se acota entre 1 y 100 aunque pidan de mas', async () => {
  let recibido;
  const repo = { findByCanal: async (tipo_canal, categoria, filtros) => { recibido = filtros; return []; } };
  const useCase = new ListarMensajesChatUseCase(repo);

  await useCase.execute({ tipo_canal: 'GLOBAL', remitente: jefeBomberos, limite: '9999' });
  assert.equal(recibido.limite, 100);

  await useCase.execute({ tipo_canal: 'GLOBAL', remitente: jefeBomberos, limite: '0' });
  assert.equal(recibido.limite, 50);
});
