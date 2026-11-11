# Feature: Cierre de alerta por informe de atención (solo instituciones Bomberos)

#### Detalle:
las instituciones envían un informe de atención (formulario con causa,
acciones, heridos, etc.) sobre una alerta que atendieron. Necesitamos poder validar que
la alerta ya fue controlada en base a ese informe — pero no cualquier institución
debería poder certificarlo: no tiene sentido que, por ejemplo, una institución de
categoría `POLICIA` o una médica cierre un incendio. Solo instituciones de categoría
`BOMBEROS` pueden emitir/completar este informe; las demás categorías
(`POLICIA`, `DEFENSA_CIVIL`, `RESCATE`, `OTRA`) siguen pudiendo recibir/atender la
notificación de la alerta (eso no cambió), pero no pueden completar este informe ni, por
lo tanto, cerrar la alerta.

Implementado en: `backend/api/interfaces/features/informeAtencionRoter/`. Ya consumido
por `frontend/src/services/report.service.ts` y `InstitutionReportsView.vue` (contrato
sin cambios de forma; lo que cambió es quién puede llamarlo y el efecto al completar).

## Métodos usados

Get: `api/informes-atencion`
- Query params opcionales: `id_institucion`, `id_alerta`, `estado`. Sin restricción de
  categoría (cualquier rol autenticado puede listar/consultar).
- Response (`data`, array de objetos con el shape de abajo).

Get: `api/informes-atencion/:id`
- Response (`data`):
```json
{
  "id_informe_atencion": 5,
  "id_alerta": 7,
  "id_institucion": 3,
  "id_usuario": 12,
  "estado": "BORRADOR",
  "fecha_incidente": "2026-10-27",
  "hora_recepcion": "14:32:00",
  "hora_salida": null,
  "hora_llegada": null,
  "hora_control": null,
  "hora_finalizacion": null,
  "personal": null,
  "vehiculos": null,
  "personas_afectadas": null,
  "personas_evacuadas": null,
  "heridos": null,
  "fallecidos": null,
  "danos_materiales": null,
  "causa": null,
  "acciones": null,
  "observaciones": null,
  "recomendaciones": null,
  "fecha_envio": "2026-10-27T14:35:00.000Z"
}
```

Post: `api/informes-atencion` (restringido: nuevo)
- Requiere sesión con rol `JEFE_INSTITUCION` u `OPERATIVO`, **de una institución con
  `categoria: "BOMBEROS"`**. Si no cumple: 403
  `{ "error": "No tiene permisos para esta acción", "code": "FORBIDDEN" }`.
- `id_institucion`/`id_usuario` los pone el backend desde la sesión — **no enviarlos en
  el body ni confiar en que el backend los respete si se envían**, se ignoran a propósito.
- body:
```json
{
  "id_alerta": 7,
  "estado": "BORRADOR",
  "fecha_incidente": "2026-10-27",
  "hora_recepcion": "14:32",
  "personal": 6,
  "vehiculos": 2,
  "causa": "Corto circuito"
}
```
  (todos los campos salvo `id_alerta` son opcionales al crear; `estado` por defecto es
  `"BORRADOR"` si se omite. Valores válidos de `estado`: `"BORRADOR" | "COMPLETADO"`.)
- Response (`data`): el informe creado, mismo shape que `GET /informes-atencion/:id`.
- Si se crea directamente con `"estado": "COMPLETADO"`, cierra la alerta de inmediato
  (ver "Efecto al completar" más abajo) — en la práctica, el flujo normal es crear en
  `BORRADOR` y completar después con `PUT`.

Put: `api/informes-atencion/:id` (restringido: nuevo; mismo efecto de cierre: nuevo)
- Mismas restricciones de rol/categoría que el `POST`. Además, solo puede actualizar un
  informe el usuario cuya **institución** coincide con `id_institucion` del informe (si
  no: 400 `"No puedes modificar un informe de otra institucion"`).
- body: cualquier subconjunto de los mismos campos que el `POST` (sin `id_alerta`,
  `id_institucion` ni `id_usuario` — esos no se pueden cambiar).
```json
{ "estado": "COMPLETADO", "hora_control": "15:10", "hora_finalizacion": "15:40", "causa": "Corto circuito", "acciones": "Aislamiento y extinción" }
```
- Response (`data`): el informe actualizado, mismo shape que `GET /informes-atencion/:id`.

### Efecto al completar (`estado: "COMPLETADO"`)

Solo la transición de `BORRADOR` → `COMPLETADO` dispara el cierre (volver a mandar
`COMPLETADO` sobre un informe ya completado no hace nada extra, es seguro reintentar).
En una sola operación atómica en el backend:
1. La alerta pasa a `estado: "CERRADA"` con `fecha_cierre`.
2. Todos los OPERATIVO que estaban `ASIGNADO` a esa alerta quedan `LIBERADO` (ver
   `frontend/docs/features/asignacion-operativos.md`) — vuelven a estar disponibles.

Esto ya **no** depende de que todas las instituciones notificadas cierren su envío
(`PATCH /alertas/:id/instituciones/:id_institucion/cerrar`) — ese endpoint sigue
existiendo para que cada institución marque que terminó su parte, pero ya no cierra la
alerta global por sí solo.

## Sugerencia de cómo debería ser la vista

- El formulario de informe de atención (ya existe) debería, al cargar, verificar si la
  institución del usuario logueado es `BOMBEROS`; si no lo es, mostrar el formulario en
  modo solo-lectura o con un aviso "Tu institución no puede completar este informe"
  antes de intentar enviarlo (el backend lo rechaza igual, pero evita el viaje extra).
- Al guardar como `COMPLETADO`, mostrar una confirmación explícita de que la alerta se
  cerró (p. ej. "Alerta #7 marcada como controlada"), ya que es un efecto adicional al
  simple guardado del formulario.
