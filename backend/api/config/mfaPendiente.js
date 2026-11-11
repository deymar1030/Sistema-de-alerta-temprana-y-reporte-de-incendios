// TTL de la sesion "pendiente de MFA" emitida tras validar correo/contrasena
// en una cuenta con rol.mfa_obligatorio=true, antes de validar el codigo
// TOTP. Corta a proposito: solo debe durar lo que tarda el usuario en abrir
// su app de autenticacion. Usado tanto al crear la sesion (createSesion.useCase.js)
// como al fijar la cookie (authRoter/controller.js) para que ambas no se desincronicen.
export const MFA_PENDIENTE_TTL_MINUTOS = 5;
export const MFA_PENDIENTE_TTL_MS = MFA_PENDIENTE_TTL_MINUTOS * 60 * 1000;
