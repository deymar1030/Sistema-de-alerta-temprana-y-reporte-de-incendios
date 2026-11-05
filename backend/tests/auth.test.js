import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSecret, generate } from 'otplib';
import AuthenticateUseCase from '../api/application/auth/useCases/authenticate.useCase.js';
import IniciarMfaUseCase from '../api/application/auth/useCases/iniciarMfa.useCase.js';
import VerificarMfaUseCase from '../api/application/auth/useCases/verificarMfa.useCase.js';
import { Hash } from '../api/config/hash.js';

const CONTRASENA = 'clave-correcta-123';

function usuarioBase(overrides = {}) {
  return {
    id_usuario: 1,
    id_rol: 7,
    correo: 'jefe@institucion.test',
    contrasena: null,
    fecha_eliminacion: null,
    estado: true,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    mfa_secreto: null,
    mfa_habilitado: false,
    ...overrides,
  };
}

function fakeRepos({ usuario, politica = null } = {}) {
  const usuarioRepository = {
    bloqueado: null,
    resets: 0,
    incrementos: 0,
    async incrementarIntentosFallidos() {
      this.incrementos += 1;
      usuario.intentos_fallidos += 1;
      return usuario.intentos_fallidos;
    },
    async resetearIntentos() {
      this.resets += 1;
      usuario.intentos_fallidos = 0;
    },
    async bloquear(id_usuario, bloqueado_hasta) {
      this.bloqueado = bloqueado_hasta;
      usuario.bloqueado_hasta = bloqueado_hasta;
      usuario.intentos_fallidos = 0;
    },
    async guardarSecretoMfa(id_usuario, secreto) {
      usuario.mfa_secreto = secreto;
      usuario.mfa_habilitado = false;
    },
    async habilitarMfa() {
      usuario.mfa_habilitado = true;
    },
  };

  const sesionRepository = {
    revocadas: 0,
    confirmada: null,
    async revokeAllByUsuario() {
      this.revocadas += 1;
    },
    async confirmarMfa(id_sesion, expira_en) {
      this.confirmada = { id_sesion, expira_en };
    },
  };

  const authRepository = { async findByCorreo() { return usuario; } };
  const politicaRepository = { async findEfectivaByRol() { return politica; } };

  return { usuarioRepository, sesionRepository, authRepository, politicaRepository };
}

test('Lockout: sin politica asociada al rol, los intentos fallidos no bloquean la cuenta', async () => {
  const usuario = usuarioBase({ contrasena: await Hash.hash(CONTRASENA) });
  const repos = fakeRepos({ usuario, politica: null });
  const useCase = new AuthenticateUseCase(repos);

  for (let i = 0; i < 10; i++) {
    await assert.rejects(useCase.execute({ correo: usuario.correo, contrasena: 'mala' }));
  }

  assert.equal(repos.usuarioRepository.incrementos, 0);
  assert.equal(usuario.bloqueado_hasta, null);
});

test('Lockout: al llegar al umbral de la politica, bloquea la cuenta y revoca sus sesiones', async () => {
  const usuario = usuarioBase({ contrasena: await Hash.hash(CONTRASENA) });
  const politica = { max_intentos_fallidos: 3, tiempo_bloqueo_minutos: 15 };
  const repos = fakeRepos({ usuario, politica });
  const useCase = new AuthenticateUseCase(repos);

  await assert.rejects(useCase.execute({ correo: usuario.correo, contrasena: 'mala' }));
  await assert.rejects(useCase.execute({ correo: usuario.correo, contrasena: 'mala' }));
  assert.equal(usuario.bloqueado_hasta, null);
  assert.equal(repos.sesionRepository.revocadas, 0);

  await assert.rejects(useCase.execute({ correo: usuario.correo, contrasena: 'mala' }));
  assert.ok(usuario.bloqueado_hasta > new Date());
  assert.equal(repos.sesionRepository.revocadas, 1);
});

test('Lockout: cuenta bloqueada rechaza incluso con la contrasena correcta, hasta que venza', async () => {
  const usuario = usuarioBase({
    contrasena: await Hash.hash(CONTRASENA),
    bloqueado_hasta: new Date(Date.now() + 10 * 60 * 1000),
  });
  const repos = fakeRepos({ usuario, politica: { max_intentos_fallidos: 3, tiempo_bloqueo_minutos: 15 } });
  const useCase = new AuthenticateUseCase(repos);

  await assert.rejects(
    useCase.execute({ correo: usuario.correo, contrasena: CONTRASENA }),
    /bloqueada/i
  );
});

test('Lockout: login exitoso resetea el contador de intentos fallidos', async () => {
  const usuario = usuarioBase({ contrasena: await Hash.hash(CONTRASENA), intentos_fallidos: 2 });
  const repos = fakeRepos({ usuario, politica: { max_intentos_fallidos: 5, tiempo_bloqueo_minutos: 15 } });
  const useCase = new AuthenticateUseCase(repos);

  await useCase.execute({ correo: usuario.correo, contrasena: CONTRASENA });

  assert.equal(repos.usuarioRepository.resets, 1);
  assert.equal(usuario.intentos_fallidos, 0);
});

test('MFA: IniciarMfaUseCase genera un secreto nuevo y lo guarda sin habilitar', async () => {
  const usuario = usuarioBase();
  const repos = fakeRepos({ usuario });
  const useCase = new IniciarMfaUseCase(repos);

  const { secreto, uri } = await useCase.execute(usuario);

  assert.ok(secreto.length > 0);
  assert.equal(usuario.mfa_secreto, secreto);
  assert.equal(usuario.mfa_habilitado, false);
  assert.match(uri, /^otpauth:\/\/totp\//);
  assert.match(uri, /jefe%40institucion\.test/);
});

test('MFA: VerificarMfaUseCase rechaza un codigo invalido sin confirmar la sesion', async () => {
  const usuario = usuarioBase({ mfa_secreto: generateSecret() });
  const repos = fakeRepos({ usuario });
  const useCase = new VerificarMfaUseCase(repos, { ttlHoras: 8 });

  await assert.rejects(
    useCase.execute({ usuario, sesion: { id_sesion: 99 }, codigo: '000000' }),
    /inv[aá]lido/i
  );
  assert.equal(repos.sesionRepository.confirmada, null);
});

test('MFA: codigo valido en la primera confirmacion habilita el MFA y confirma la sesion', async () => {
  const secreto = generateSecret();
  const usuario = usuarioBase({ mfa_secreto: secreto, mfa_habilitado: false });
  const repos = fakeRepos({ usuario });
  const useCase = new VerificarMfaUseCase(repos, { ttlHoras: 8 });

  const codigo = await generate({ secret: secreto });
  await useCase.execute({ usuario, sesion: { id_sesion: 99 }, codigo });

  assert.equal(usuario.mfa_habilitado, true);
  assert.ok(repos.sesionRepository.confirmada);
  assert.equal(repos.sesionRepository.confirmada.id_sesion, 99);
  assert.ok(repos.sesionRepository.confirmada.expira_en > new Date());
});
