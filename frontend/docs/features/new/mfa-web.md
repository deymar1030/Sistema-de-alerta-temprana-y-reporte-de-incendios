# MFA en el frontend web según la política de la cuenta

Implementado en `frontend-integrations`, dentro de `REPOSITORIO ORIGINAL/frontend`. El contrato se verificó contra el backend actual de `REPOSITORIO/backend`. No se modificaron políticas de roles, cuentas reales ni variables de entorno.

## Problema

El backend ya devolvía un desafío MFA después de validar las credenciales, pero el frontend esperaba siempre un usuario autenticado. Además, consultar `/auth/me` con una sesión pendiente provoca su rechazo y el borrado de la cookie por el middleware del backend.

La obligatoriedad actual proviene de `usuario.rol.mfa_obligatorio`. Para la cuenta que inicia sesión, `usuario.mfa_habilitado` distingue configuración inicial de verificación. El frontend sigue esa respuesta; no activa MFA para todos ni decide por nombres de roles. El backend actual no ofrece una excepción individual a la obligatoriedad de un rol: si se necesita esa excepción, requiere otra política en el backend.

## Modificación

| Antes | Después | Motivo |
| --- | --- | --- |
| Una respuesta de login sin usuario se interpretaba como error. | Se distinguen sesión completa, configuración MFA y verificación MFA. | Respetar el estado comunicado para esa cuenta. |
| La confirmación de sesión podía consultar `/auth/me` antes de completar MFA. | `/auth/me` se consulta después de verificar el código. | Conservar la cookie de sesión pendiente. |
| No existía una pantalla para completar el desafío. | Pantalla `/mfa` con cuenta, tiempo disponible, código y errores accesibles. | Completar la autenticación sin acceder prematuramente al dashboard. |
| Las redirecciones tenían lógica duplicada y destinos incompletos para AUDITOR. | Destinos y validación de redirecciones compartidos. | Mantener el acceso correspondiente al rol confirmado. |
| El acceso alternativo de ciudadanos no contemplaba MFA. | Ambos formularios de ingreso reconocen el desafío. | Aplicar el mismo contrato en toda la web. |
| Un fallo del login real podía terminar usando usuarios de demostración. | Las credenciales de demostración solo se usan con el modo de mocks explícitamente activado. | Evitar que un error de autenticación real habilite una sesión de prueba. |

La pantalla conserva los colores institucionales y prioriza una única acción. Incluye campos etiquetados, foco visible, mensajes de error anunciados, controles de al menos 44 px y presentación sin desbordamiento a 360 px.

## Contrato y comportamiento

1. `POST /auth/login`, con `{ correo, contrasena }` y credenciales de navegador, devuelve un usuario o `{ success: true, data: null, mfa: { estado } }`.
2. `CONFIGURACION_REQUERIDA` muestra una acción explícita para llamar a `POST /auth/mfa/configurar`. Su respuesta contiene `{ secreto, uri }`. Se presenta QR y una alternativa de configuración manual.
3. `VERIFICACION_REQUERIDA` muestra únicamente el ingreso del código del autenticador existente; no ofrece regenerar el secreto.
4. `POST /auth/mfa/verificar` recibe `{ codigo }`: seis dígitos como cadena, conservando ceros iniciales. Después del éxito, `/auth/me` confirma la misma identidad antes de habilitar navegación autenticada.
5. Las rutas protegidas se mantienen inaccesibles mientras existe un desafío. Las redirecciones se limitan a rutas internas del ámbito del rol y los permisos de cada ruta siguen vigentes.

| Rol confirmado | Destino inicial |
| --- | --- |
| ADMIN | `/super-admin/dashboard` |
| AUDITOR | `/auditor/auditoria` |
| JEFE_INSTITUCION | `/institucion/dashboard` |
| OPERATIVO | `/institucion/dashboard`, conservando los permisos web existentes |
| CIUDADANO | `/ciudadano/inicio` |

Un estado MFA desconocido se rechaza. Un código inválido permite reintentar sin regenerar el secreto; los límites de intentos del backend se muestran como error. Una sesión expirada o rechazada exige iniciar sesión nuevamente. El contador usa los cinco minutos de vigencia definidos actualmente por el backend; este último conserva la autoridad sobre la expiración real.

El desafío y el material de configuración se mantienen solo en memoria, sin localStorage ni sessionStorage. Al recargar la página se solicita un nuevo ingreso. El QR se genera dentro del navegador con [node-qrcode](https://github.com/soldair/node-qrcode), sin enviar el secreto a servicios de imágenes. La clave manual solo se copia al portapapeles por acción explícita. Código, QR y clave se limpian al completar, cancelar, expirar o desmontar la vista.

## Archivos

- `src/services/auth.service.ts`: contrato de login, errores con código y solicitudes de configuración/verificación.
- `src/stores/auth.store.ts`: estado pendiente, confirmación de identidad, caducidad y cancelación.
- `src/utils/mfa.ts`: validación de estados, respuesta de configuración y códigos.
- `src/utils/auth-navigation.ts`: destinos por rol y validación de redirecciones.
- `src/views/MfaView.vue`: configuración y verificación del autenticador.
- `src/views/LoginView.vue` y `src/views/CitizenLoginView.vue`: ingreso compatible con MFA.
- `src/main.ts` y `src/router/index.ts`: protección de navegación y ruta `/mfa`.
- `tests/mfa.test.mjs`: pruebas del contrato y redirecciones.
- `package.json` y `package-lock.json`: `qrcode` y tipos de TypeScript.

## Hallazgo pendiente en el backend

**Debe corregirse antes de desplegar MFA.** En `backend/api/application/auth/useCases/iniciarMfa.useCase.js`, la configuración genera y guarda un secreto sin rechazar previamente a un usuario con `mfa_habilitado === true`. La ruta exige sesión pendiente, pero una cuenta que debería verificar su autenticador existente también puede tener ese tipo de sesión.

Por tanto, alguien con la contraseña podría invocar directamente `/auth/mfa/configurar`, reemplazar el secreto y verificar uno nuevo. Ocultar el botón en el frontend no impide esa llamada. El backend debe rechazar esta operación cuando MFA ya está habilitado y reservar el restablecimiento a un procedimiento de recuperación autorizado. Debe comprobarse con una prueba que una sesión pendiente de verificación no puede regenerar ni deshabilitar su factor.

Esta entrega modifica exclusivamente el frontend solicitado; no implementa recuperación de MFA ni cambia el backend. La integración web funcional no resuelve por sí sola ese hallazgo.

## Validación

- `npm run build`: TypeScript y compilación de producción correctos. Permanecen los avisos existentes de tamaño del bundle e importaciones mixtas.
- `node --experimental-strip-types --test tests/mfa.test.mjs`: cinco pruebas aprobadas de contrato, configuración, códigos, destinos y redirecciones.
- `node --test tests/auth.test.js`, en el backend revisado: siete pruebas existentes aprobadas con repositorios de prueba. Estas pruebas no cubren el hallazgo de regeneración descrito arriba.
- Navegador con API simulada: 42 comprobaciones aprobadas, sin errores de JavaScript. Se verificaron roles sin MFA, configuración, QR local, código inválido, límites de intentos, ceros iniciales, sesión pendiente, confirmación de identidad, expiración, recarga, reintento y cambio de cuenta.
- Regresión en navegador con API simulada: 28 comprobaciones de mapas, 24 de rutas de alertas y 40 de lecturas aprobadas, sin errores de JavaScript.
- Presentación revisada en escritorio y a 360 px. No se configuró MFA en cuentas reales durante las pruebas.

Para comprobar la integración real, usar una cuenta de prueba cuya política de rol requiera MFA y otra cuya política no lo requiera. La primera debe configurar o verificar según su estado persistido; la segunda debe entrar directamente. Esta comprobación debe realizarse después de corregir el hallazgo del backend.
