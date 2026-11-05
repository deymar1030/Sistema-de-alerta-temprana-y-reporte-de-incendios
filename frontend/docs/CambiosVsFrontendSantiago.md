# Cambios de `frontend-integrations` respecto a `frontend-santiago`

Esta rama parte de `origin/frontend-santiago` tal cual está en producción
(commit `0e448e3`, "merge: integrar nuevo diseño de ALERTA"). Todo lo que
no se menciona acá es **idéntico** a esa rama — `frontend-integrations` no
es un frontend paralelo, es santiago con estas integraciones puntuales
encima.

No se modificó `frontend-santiago`; esta rama existe aparte para no tocarla.

---

## Resumen ejecutivo

| Tipo | Cantidad | Qué es |
|---|---|---|
| Archivos modificados respecto a santiago | 7 | Ver detalle abajo |
| Archivos nuevos (no existen en santiago) | 4 | Chat de coordinación (3) + carpeta de documentación (1, con varios archivos adentro) |
| Archivos borrados | 0 | No se eliminó nada de lo que trae santiago |

---

## 1. Archivos modificados

### `src/views/InstitutionAlertDetailView.vue`
**El cambio más grande.** Es una fusión manual, no un reemplazo:
- La lógica de **asignar operativos a una alerta** es la de santiago
  (`operativeAssignmentService`, con manejo de carga/error/disponibilidad)
  porque es la que realmente funciona — la versión que había en este
  checkout antes de fusionar llamaba a métodos (`userService.getOperativos()`,
  `notificationService.asignarAlerta()`) que no existen en los servicios
  reales.
- El **mapa de ruta más corta** (Leaflet, dibuja origen/destino/trazado
  usando `myDelivery.ruta`) es una funcionalidad que **no existe en
  santiago en absoluto** — se agregó completa en esta rama.

### `src/services/backend-alerts.service.ts`
Se conservó tal cual estaba en este checkout (no es la versión de
santiago). Agrega el tipo `RouteInfo` y los campos `ruta`,
`ruta_calculada_en`, `ruta_error` a `InstitutionDelivery` — es el contrato
que necesita el mapa de ruta mencionado arriba. Santiago no tiene estos
campos.

### `src/services/audit.service.ts`
Se usa la versión de santiago (`SystemAuditEntry`, `getSystemEvents`,
`getUserEvents`), con un único agregado: el campo `ip_origen` en
`UserAuditEntry`, que la versión de santiago no traía pero sí existe en la
columna real `auditoriau.ip_origen` del backend.

### `src/views/AuditView.vue`
Versión de santiago, con una columna "IP" agregada a la tabla de
"Acciones por usuario" para mostrar el campo `ip_origen` mencionado arriba.

### `src/stores/auth.store.ts`
Versión de santiago + una línea: al cerrar sesión (`logout()`), ahora
también limpia el store del chat (`useChatStore().clear()`), igual que ya
hace con el resto de los stores.

### `src/layouts/MonitoringLayout.vue`
Versión de santiago + un link nuevo en el menú lateral: **"Chat de
coordinación"**, agregado tanto para `JEFE_INSTITUCION` como para
`OPERATIVO`.

### `src/router/index.ts`
Versión de santiago + una ruta nueva: `/institucion/chat` → `ChatView.vue`,
con el mismo guard de roles que el resto de la sección institucional
(`JEFE_INSTITUCION`, `OPERATIVO`).

---

## 2. Archivos nuevos

### Chat de coordinación entre instituciones

Tres archivos nuevos que implementan el frontend del chat (el backend ya
existe, ver más abajo "Dependencias"):

| Archivo | Qué hace |
|---|---|
| `src/services/chat.service.ts` | Llama a `GET /api/chat/global`, `GET /api/chat/categoria`, `POST /api/chat/mensajes` |
| `src/stores/chat.store.ts` | Maneja los dos canales (global y por categoría de institución), envío, paginación de mensajes antiguos, y **polling cada 8s** (este frontend no usa Socket.IO en ningún lado — se confirmó en `SuperAdminAlertsView.vue` que usa el mismo patrón de sincronización periódica, así que el chat sigue esa misma convención) |
| `src/views/ChatView.vue` | Pantalla con dos pestañas ("General" / "Mi institución"), burbujas de mensaje, scroll automático |

### `frontend/docs/features/` (carpeta completa)

Santiago **eliminó** esta carpeta por completo (`asignacion-operativos.md`,
`auditoria.md`, `cierre-alerta-informe-atencion.md`,
`corroboracion-reportes-ciudadanos.md`, `disponibilidad-institucion.md`,
sus PDFs, y `README.md`). Se decidió conservarla en vez de borrarla —
es documentación de contratos de features ya implementadas, no afecta a
la aplicación en sí. Incluye también `new/comparativa-frontend-santiago-ruta-alerta-institucional.md`,
un documento de análisis previo (4-nov-2026) que propuso cómo integrar
varias de estas diferencias — varios de esos puntos ya se resolvieron acá
(el mapa de ruta, la asignación de operativos, `ip_origen` en auditoría);
otros puntos que menciona (perfil de cuenta, mapa de directorio de
predios, mejoras de lecturas, modal de alertas en admin) **no se tocaron
en esta rama** y siguen siendo trabajo pendiente si se quiere continuar
esa integración.

---

## 3. Dependencias con el backend

El chat de esta rama **no funciona solo** — necesita:

1. El commit `6385018` ("feat(chat): chat de coordinación entre
   instituciones") en `prod/backend`, que agrega `GET/POST /api/chat/*`.
2. La migración de base de datos de la tabla `mensaje_chat` (ya aplicada
   en producción con `npx prisma db push`, confirmado).
3. El redeploy del backend con ese commit activo.

El mapa de ruta (`InstitutionAlertDetailView.vue`) depende de que
`backend/api/application/alerta/calcularRutasEnvios.js` y el
`routing-service` sigan funcionando — eso ya estaba desplegado desde
antes, no es parte de esta rama.

---

## 4. Qué NO cambió

Todo lo demás de `frontend/` es exactamente el contenido de
`frontend-santiago`: servicios (`auth`, `institution`, `notification`,
`operative-assignment`, `profile`, `report`, `user`), vistas
(`SuperAdmin*`, `Institution*` salvo la mencionada, `Central*`,
`Locations`, `Predios`, `Readings`, `Sensors`, `Settings`,
`AdminUsers`), componentes (`AccountProfileForm.vue`,
`PrediosDirectoryMap.vue`), estilos y `.gitignore`. No se reescribió ni
se "mejoró" nada de eso — se trajo tal cual.
