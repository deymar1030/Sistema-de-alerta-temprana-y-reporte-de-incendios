import test from 'node:test'
import assert from 'node:assert/strict'
import { isMfaCode, readMfaEnrollment, readMfaState } from '../src/utils/mfa.ts'
import { homeForRole, isCompatibleRedirect } from '../src/utils/auth-navigation.ts'

test('MFA se solicita únicamente cuando el servidor lo exige a la cuenta', () => {
  for (const role of ['ADMIN', 'AUDITOR', 'JEFE_INSTITUCION', 'OPERATIVO', 'CIUDADANO']) {
    assert.equal(readMfaState({ success: true, data: { nombre_rol: role } }), null)
  }
  for (const estado of ['CONFIGURACION_REQUERIDA', 'VERIFICACION_REQUERIDA']) {
    assert.equal(readMfaState({ success: true, data: null, mfa: { estado } }), estado)
  }
  assert.throws(() => readMfaState({ success: true, data: { nombre_rol: 'ADMIN' }, mfa: { estado: 'DESCONOCIDO' } }))
  assert.throws(() => readMfaState({ success: false, mfa: { estado: 'VERIFICACION_REQUERIDA' } }))
})

test('el QR representa el mismo secreto TOTP recibido y no acepta enlaces externos', () => {
  const secreto = 'JBSWY3DPEHPK3PXP'
  const uri = `otpauth://totp/ALERTA:prueba?secret=${secreto}&issuer=ALERTA`
  assert.deepEqual(readMfaEnrollment({ secreto, uri }), { secreto, uri })
  for (const invalid of ['https://example.test/?secret=' + secreto, 'otpauth://hotp/test?secret=' + secreto, 'otpauth://totp/test?secret=OTRO']) {
    assert.throws(() => readMfaEnrollment({ secreto, uri: invalid }))
  }
  assert.throws(() => readMfaEnrollment(null))
})

test('el código conserva ceros iniciales y exige seis dígitos', () => {
  assert.equal(isMfaCode('012345'), true)
  for (const code of ['12345', '1234567', '12a456', '123 56', '']) assert.equal(isMfaCode(code), false)
})

test('el destino tras login y MFA respeta todos los roles existentes', () => {
  const destinations = { ADMIN: '/super-admin/dashboard', AUDITOR: '/auditor/auditoria', JEFE_INSTITUCION: '/institucion/dashboard', OPERATIVO: '/institucion/dashboard', CIUDADANO: '/ciudadano/inicio' }
  for (const [role, destination] of Object.entries(destinations)) {
    assert.equal(homeForRole(role), destination)
    assert.equal(isCompatibleRedirect(destination, role), true)
  }
  assert.equal(homeForRole(null), '/login')
  assert.equal(isCompatibleRedirect('/super-admin/dashboard', 'AUDITOR'), false)
  assert.equal(isCompatibleRedirect('/auditor/auditoria', 'JEFE_INSTITUCION'), false)
})

test('no permite redirecciones externas ni coincidencias parciales de prefijos', () => {
  for (const redirect of ['//example.test', 'https://example.test', '/super-admin-extra', '/\\example.test', '/super-admin/\n']) {
    assert.equal(isCompatibleRedirect(redirect, 'ADMIN'), false)
  }
  assert.equal(isCompatibleRedirect('/super-admin/lecturas?id_sensor=2', 'ADMIN'), true)
})
