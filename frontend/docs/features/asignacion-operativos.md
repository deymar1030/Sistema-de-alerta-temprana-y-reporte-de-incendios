# Feature: Asignación de operativos a una alerta

#### Detalle:
cuando una alerta ya fue enviada a una institución, el JEFE_INSTITUCION debe
poder elegir a cuáles de sus usuarios OPERATIVO manda al lugar, en vez de que la alerta le llegue a todo el personal por igual. Mientras un operativo esté asignado a una alerta activa, no puede ser asignado a una segunda — si hubiera 2 alertas al mismo tiempo, el empleado no sabría a cuál ir — y el backend lo rechaza. El operativo queda liberado automáticamente cuando esa alerta se cierra (ver
`frontend/docs/features/cierre-alerta-informe-atencion.md`), sin ninguna acción manual
adicional.

Implementado en: `backend/api/application/notificacion/useCases/asignarAlertaOperativos.useCase.js`
y `backend/api/application/usuario/useCases/getOperativosInstitucion.useCase.js`. Ya
consumido en `InstitutionAlertDetailView.vue` como referencia de implementación (no se
tocó `frontend/ALERTA_Movil`: el operativo sigue recibiendo la notificación existente
ahí, sin rutas nuevas).

## Métodos usados

Get: `api/usuarios/operativos`
- Requiere sesión con rol `JEFE_INSTITUCION`. Devuelve los OPERATIVO activos de **su
  propia** institución (no admite `id_institucion` por query, siempre usa la sesión).
- Response (`data`, array):
```json
[
  {
    "id_usuario": 12,
    "id_rol": 2,
    "nombre_rol": "OPERATIVO",
    "id_institucion": 3,
    "nombre": "Luis Flores",
    "telefono": "+591 700...",
    "correo": "luis@...",
    "estado": true,
    "disponible": true,
    "id_alerta_asignada": null
  },
  {
    "id_usuario": 13,
    "nombre_rol": "OPERATIVO",
    "nombre": "Ana Quispe",
    "estado": true,
    "disponible": false,
    "id_alerta_asignada": 7
  }
]
```
- `disponible: false` + `id_alerta_asignada` → ese operativo ya está `ASIGNADO` a esa
  alerta y el backend rechazará asignarlo a otra mientras siga activa.

Post: `api/notificaciones/asignaciones`
- Requiere sesión con rol `JEFE_INSTITUCION`.
- body:
```json
{
  "id_alerta": 7,
  "id_usuarios": [12, 13]
}
```
- Reglas que valida el backend (en este orden): la alerta debe tener un envío recibido
  por tu institución; todos los `id_usuarios` deben ser OPERATIVO activos de tu
  institución; ninguno puede tener ya una asignación `ASIGNADO` a **otra** alerta activa
  (reasignar a la misma alerta es idempotente, no falla). Errores, todos 400:
  - `"Esta alerta no fue enviada a tu institución"`
  - `"Usuario(s) no válidos: no son OPERATIVO activo de tu institución: 12, 13"`
  - `"Usuario(s) ya asignado(s) a otra alerta activa: usuario 13 -> alerta #4"`
- Response (`data`, array de notificaciones creadas — **no** incluye `id_usuario`
  destinatario, es una limitación existente del DTO; para saber a quién se asignó, usar
  la lista que el propio frontend envió en el body):
```json
[
  { "id_notificacion": 101, "id_usuario_emisor": 1, "id_alerta": 7, "tipo": "ALERTA", "titulo": "Alerta asignada", "mensaje": "...", "fecha_hora": "...", "leida": false }
]
```

Para elegir a qué alerta asignar, se reutiliza lo que ya existe (sin cambios):

Get: `api/alertas/activas` — lista de alertas activas, para elegir una.
Get: `api/alertas/:id` — detalle completo de una alerta (incluye
`instituciones_notificadas`, útil para confirmar que la propia institución está ahí
antes de mostrar el formulario de asignación).

## Sugerencia de cómo debería ser la vista

- Dentro del detalle de una alerta (no en el listado), una sección "Asignar operativos a
  esta alerta", visible solo si el usuario logueado es `JEFE_INSTITUCION`.
- Lista de checkboxes, uno por operativo de `GET /usuarios/operativos`:
  - Si `disponible: true`: checkbox habilitado.
  - Si `disponible: false`: checkbox deshabilitado + etiqueta junto al nombre, p. ej.
    "Asignado a alerta #7".
- Botón "Asignar alerta a seleccionados", deshabilitado si no hay ninguno marcado o si
  la petición está en curso.
- Al terminar con éxito: mensaje de confirmación y volver a pedir
  `GET /usuarios/operativos` (la disponibilidad cambió para los recién asignados).
- Mostrar el error del backend tal cual si el POST falla (ya viene en español).
