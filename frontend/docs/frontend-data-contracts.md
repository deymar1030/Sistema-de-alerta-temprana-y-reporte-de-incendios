# Contratos de datos del frontend ALERTA

Este documento describe los DTO que el frontend espera recibir cuando se conecte la API. No define endpoints, persistencia ni comportamiento de backend. Los JSON son ejemplos ficticios; las fechas, IDs y relaciones no representan eventos reales.

## Fuente actual y transición

El frontend web usa actualmente `src/mocks/` a través de `src/services/` y Pinia stores. Sus vistas consumen modelos demo existentes en `src/types/index.ts`, varios de ellos en español o con campos snake_case. Esos modelos se mantienen para no cambiar la lógica ni romper vistas.

Los contratos normalizados viven en `src/types/contracts.ts` en web y en `ALERTA_Movil/src/types/contracts.ts` en móvil. Ambos archivos son equivalentes y deliberadamente no se importan entre proyectos. El archivo de móvil establece el vocabulario compartido futuro; actualmente la app móvil no tiene carpetas propias de types, mocks, services o stores.

Al incorporar la API, los services deben convertir la respuesta DTO a los modelos demo/UI que aún necesiten las vistas, o migrar las vistas de forma incremental. No se deben renombrar campos ni estados a ciegas. Las funciones demo actuales no hacen `fetch` ni llamadas de red.

## Convenciones

- Todos los IDs son `string`, incluso si el servidor usa UUID. Los ejemplos usan IDs legibles como `INC-001`.
- Los nombres de contrato son `camelCase`; los enums de estado/origen/tipo se serializan en mayúsculas con `_`.
- `IsoDateTime` es un alias TypeScript de `string`. En payloads, enviar timestamps ISO 8601 con zona horaria, por ejemplo `2026-09-30T14:32:00-04:00`. Una fecha local (`30/09/2026`), una fecha sin zona horaria o una fecha y hora separadas no son un `IsoDateTime` válido.
- Coordenadas usan `latitude` y `longitude` decimales con signo; ALERTA usa `La Paz` como ciudad demo.
- Los campos opcionales se omiten cuando se desconocen; no se reemplazan con strings vacíos ni valores inventados.
- `RiskLevel` conserva deliberadamente los valores existentes del dominio web (`normal`, `warning`, `high`, `critical`) para no romper mapa, detección y mocks. La UI traduce sus etiquetas. No enviar etiquetas visibles como `ADVERTENCIA` en ese campo.
- La confianza de detección está en escala `0..1` y es opcional. No enviar un valor hasta que el motor lo calcule.

## Enums

```text
UserRole: CENTRAL_OPERATOR | INSTITUTION_ADMIN | INSTITUTION_USER | CITIZEN
RiskLevel: normal | warning | high | critical
InstitutionType: BOMBEROS | POLICIA | DEFENSA_CIVIL | RESCATE | OTRA
InstitutionStatus: ACTIVA | INACTIVA
InstitutionAvailability: DISPONIBLE | ATENDIENDO | NO_DISPONIBLE
SensorType / ReadingType: TEMPERATURA | HUMO | CO
SensorStatus: ACTIVO | INACTIVO | MANTENIMIENTO | ERROR
AlertSource: SENSOR | CITIZEN_REPORT | MANUAL
AlertStatus: ACTIVA | EN_REVISION | RESUELTA | CANCELADA
IncidentStatus: NUEVA | EN_VALIDACION | VALIDADA | DESPACHADA | ACEPTADA | EN_CAMINO | EN_SITIO | CONTROLADA | FINALIZADA | CERRADA | RECHAZADA | FALSA_ALARMA | CANCELADA
DispatchStatus: PENDIENTE | ENVIADA | RECIBIDA | ACEPTADA | RECHAZADA | EN_CAMINO | EN_SITIO | CONTROLADA | FINALIZADA
CitizenReportStatus: RECIBIDO | EN_REVISION | VALIDADO | DESCARTADO | ATENDIDO
AttentionReportStatus: BORRADOR | PENDIENTE | COMPLETADO | REVISADO
NotificationType: ALERTA | DESPACHO | ESTADO_INCIDENTE | REPORTE_CIUDADANO | SISTEMA
AttachmentType: application/pdf | image/jpeg | image/png | image/webp | OTHER
```

`DispatchStatus.CONTROLADA` se conserva por compatibilidad con el flujo de demo actual. Es un estado de cada despacho; no sustituye al estado general de `Incident`.

## Estructuras

Los contratos canónicos completos y sus campos requeridos/opcionales están declarados en los dos archivos `src/types/contracts.ts`.

- `User`: `id`, `name`, `email`, `role`, `active`; `institutionId` y `phone` opcionales.
- `Coordinates`: `latitude`, `longitude`. `Location`: coordenadas y `city` requeridos; `id`, `name`, `address`, `zone`, `department` opcionales.
- `Institution`: identidad, `type`, `location`, `status` y `availability`; teléfono opcional.
- `Sensor`: identidad/código, tipo, estado y ubicación; fabricante, modelo, unidad y `lastReadingAt` opcionales. No contiene mediciones ni riesgo.
- `Reading`: `sensorId`, tipo físico, `value`, `unit`, `timestamp` y `valid`. No contiene un nivel de riesgo.
- `DetectionResult`: versión, hora evaluada, riesgo, IDs de lecturas, reglas activadas y razón; `confidence` opcional.
- `Alert`: fuente, estado, riesgo, ubicación y fecha; origen del resultado, reporte, lecturas y descripción opcionales.
- `Incident`: `alertId`, estado y ubicación del incidente, fechas, `dispatches[]` y `timeline[]`. No guarda un estado único de institución.
- `Dispatch`: `incidentId`, `institutionId` y estado propio. Cada hito temporal (`sentAt`, `receivedAt`, `acceptedAt`, `enRouteAt`, `arrivedAt`, `finishedAt`) es independiente y opcional.
- `CitizenReport`: descripción, tipo de incidente, ubicación, cuatro indicadores booleanos, estado y fecha; ciudadano y fotografía opcionales.
- `Notification`: destinatario opcional, tipo, título, mensaje, fecha, lectura y entidad relacionada opcional.
- `TimelineEvent`: tipo, fecha y descripción; usuario, institución y despacho opcionales.
- `Attachment`: nombre, tipo MIME, bytes, fecha de carga y URL opcional.
- `AttentionReport`: incidente, institución y estado requeridos; hitos operativos, cantidades, relato, PDF y adjuntos opcionales; `createdAt` y `updatedAt` requeridos.

## Ejemplos JSON (datos ficticios)

### Alert

```json
{
  "id": "ALT-101",
  "source": "CITIZEN_REPORT",
  "status": "ACTIVA",
  "riskLevel": "warning",
  "location": {
    "city": "La Paz",
    "address": "Av. Arce",
    "coordinates": { "latitude": -16.5, "longitude": -68.13 }
  },
  "createdAt": "2026-09-30T14:32:00-04:00",
  "citizenReportId": "REP-101",
  "description": "Humo visible desde un comercio"
}
```

### Incident

```json
{
  "id": "INC-101",
  "alertId": "ALT-101",
  "status": "VALIDADA",
  "riskLevel": "warning",
  "location": {
    "city": "La Paz",
    "address": "Av. Arce",
    "coordinates": { "latitude": -16.5, "longitude": -68.13 }
  },
  "createdAt": "2026-09-30T14:32:00-04:00",
  "updatedAt": "2026-09-30T14:40:00-04:00",
  "description": "Humo visible desde un comercio",
  "dispatches": [],
  "timeline": []
}
```

### Dispatch

```json
{
  "id": "DSP-101",
  "incidentId": "INC-101",
  "institutionId": "INS-001",
  "status": "ENVIADA",
  "sentAt": "2026-09-30T14:42:00-04:00",
  "sentByUserId": "USR-001"
}
```

### CitizenReport

```json
{
  "id": "REP-101",
  "citizenId": "USR-004",
  "description": "Humo visible desde un comercio",
  "incidentType": "INCENDIO",
  "location": {
    "city": "La Paz",
    "address": "Av. Arce",
    "coordinates": { "latitude": -16.5, "longitude": -68.13 }
  },
  "photoUrl": "https://example.invalid/report-photo.jpg",
  "smokeVisible": true,
  "flamesVisible": false,
  "peopleAtRisk": false,
  "explosions": false,
  "status": "RECIBIDO",
  "createdAt": "2026-09-30T14:32:00-04:00"
}
```

### Sensor

```json
{
  "id": "S-001",
  "code": "TEMP-A1",
  "name": "Sensor de temperatura A1",
  "type": "TEMPERATURA",
  "status": "ACTIVO",
  "model": "FG-T-200",
  "manufacturer": "FireGuard Systems",
  "location": {
    "city": "La Paz",
    "zone": "Miraflores",
    "coordinates": { "latitude": -16.5, "longitude": -68.12 }
  },
  "unit": "°C",
  "lastReadingAt": "2026-09-30T14:30:00-04:00"
}
```

### Reading

```json
{
  "id": "LEC-101",
  "sensorId": "S-001",
  "type": "TEMPERATURA",
  "value": 42.8,
  "unit": "°C",
  "timestamp": "2026-09-30T14:30:00-04:00",
  "valid": true
}
```

### DetectionResult

```json
{
  "id": "DET-101",
  "engineVersion": "1.0.0",
  "evaluatedAt": "2026-09-30T14:31:00-04:00",
  "riskLevel": "high",
  "readingIds": ["LEC-101"],
  "triggeredRules": ["TEMPERATURE_THRESHOLD"],
  "reason": "Temperatura sobre el umbral configurado"
}
```

### AttentionReport

```json
{
  "id": "INF-101",
  "incidentId": "INC-101",
  "institutionId": "INS-001",
  "status": "PENDIENTE",
  "receivedAt": "2026-09-30T14:42:00-04:00",
  "personnelCount": 6,
  "vehicleCount": 2,
  "affectedPeople": 0,
  "evacuatedPeople": 4,
  "injuredPeople": 0,
  "deceasedPeople": 0,
  "actionsTaken": "Aislamiento e inspección del área",
  "attachments": [],
  "createdAt": "2026-09-30T15:10:00-04:00",
  "updatedAt": "2026-09-30T15:10:00-04:00"
}
```

## Relaciones

- `Sensor` 1 → N `Reading` (`Reading.sensorId`).
- `DetectionResult` analiza N `Reading` (`readingIds`).
- `Alert` puede enlazar un `DetectionResult` o un `CitizenReport`.
- `Alert` 1 → 0..1 `Incident` (`Incident.alertId`).
- `Incident` 1 → N `Dispatch` y 1 → N `TimelineEvent`.
- `Incident` 1 → N `AttentionReport` cuando participan instituciones que deben informar.
- El estado de cada institución vive en su propio `Dispatch`, nunca en un campo institucional del `Incident`.

## Diferencias legacy que se mantienen temporalmente

Los modelos de `src/types/index.ts` son estructuras internas de la demo, no el contrato API final. Entre otras diferencias: `Sensor` usa `id_sensor`, `lat/lng`, riesgo y última lectura; `Reading` incluye `estado/riesgo`; `CitizenReport` usa campos españoles y coordenadas planas; `Incident` usa `riesgo/ubicacion/latitud/longitud`, permite `alertId: null` para reportes ciudadanos y obtiene timeline/dispatches desde stores separados; `AlertEntry` tiene fecha/hora partidas; `AttentionReport` tiene horas/cantidades requeridas y `Attachment` usa propiedades españolas. `Alert` en `index.ts` también es un modelo legacy distinto del DTO `Alert` aquí definido.

Estos modelos, sus mocks y los estados actuales se dejan intactos. En particular, estados como `EN_CAMINO`, `FINALIZADA`, `CONTROLADA`, `CANCELADA` y `FALSA_ALARMA` no se renombraron. Los services devuelven actualmente modelos demo y no llaman a la API. Los services web ahora declaran sus `Promise<T>` de retorno; los stores conservan refs tipadas.

La app móvil no tenía una capa propia de mocks/services/stores/types antes de esta normalización. Tiene ahora el contrato de tipos equivalente, pero todavía no consume esos DTO desde sus vistas. No se agregó conexión de red ni se alteró su flujo.
