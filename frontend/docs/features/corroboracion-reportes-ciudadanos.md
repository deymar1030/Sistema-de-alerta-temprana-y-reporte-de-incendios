# Feature: Corroboración de reportes ciudadanos (evitar alertas duplicadas)

#### Detalle:
cuando varios ciudadanos reportan el mismo incendio por separado, antes se
generaba una alerta nueva por cada reporte válido (mismo punto, decenas de alertas).
Ahora, si un reporte con detección de IA en nivel `ALTA` cae cerca (~300 m) y en el
tiempo (~60 min) de una alerta ya activa que también se originó por un reporte
ciudadano, el nuevo reporte **corrobora** esa alerta existente (sube su nivel de
confianza) en vez de crear una duplicada. Es una mejora transparente: **no hay endpoint
nuevo**, el contrato de `POST /api/reportes-usuario` no cambió de forma, solo puede
devolver `alerta_vinculada` apuntando a una alerta que ya existía antes de este reporte.

Implementado en: `backend/api/domain/deteccionImagen/buscarAlertaCorroborable.js` +
`backend/api/infrastructure/features/deteccionImagen/repositories/prismaAlertaDesdeReporte.repository.impl.js`.
Ya consumido por `frontend/src/services/citizen-report.service.ts` (sin cambios
necesarios ahí: el contrato es el mismo).

## Métodos usados

Post: `api/reportes-usuario` (sin cambio de contrato; comportamiento nuevo)
- `id_usuario` lo pone el backend desde la sesión.
- body:
```json
{
  "descripcion": "Humo visible en el mercado",
  "tipo": "INCENDIO",
  "latitud": -16.5005,
  "longitud": -68.1505,
  "foto_url": "/api/archivos/reportes-usuario/foto123.jpg",
  "ubicacion_tipo": "EXACTA"
}
```
- Response (`data`): el reporte creado. `alerta_vinculada` puede ser:
  - una alerta **nueva** (primer reporte de ese incendio), o
  - una alerta **ya existente** que este reporte acaba de corroborar (otro ciudadano la
    reportó antes). La forma de la respuesta es idéntica en ambos casos; **no hay un
    campo que distinga uno del otro** en esta respuesta HTTP.
```json
{
  "id_reporte_u": 55,
  "id_usuario": 9,
  "descripcion": "Humo visible en el mercado",
  "tipo": "INCENDIO",
  "nivel_prioridad": "ALTA",
  "estado": "RECIBIDO",
  "fecha_envio": "2026-10-27T18:05:00.000Z",
  "latitud": -16.5005,
  "longitud": -68.1505,
  "indicador": "IA: 91% incendio | Ubicacion exacta reportada",
  "foto_url": "/api/archivos/reportes-usuario/foto123.jpg",
  "ubicacion_tipo": "EXACTA",
  "alerta_vinculada": { "id_alerta": 7, "estado": "CONFIRMADA" }
}
```
- Si no hay IA disponible o la prioridad no llega a `ALTA`, el reporte se guarda igual
  pero sin `alerta_vinculada` (`null`) — esto no cambió.

No hay `GET`/`PUT` adicionales para esta feature. Para ver el detalle de la alerta
resultante (nueva o corroborada), usar lo que ya existe:

Get: `api/alertas/:id` — mismo endpoint de siempre; si fue corroboración, va a mostrar
el `puntaje` más alto que antes y seguir listando solo un `reporte_origen` (el primero;
los reportes corroborantes no reemplazan ese campo, solo afectan `puntaje`).

### Evento en vivo (Socket.IO)

- Alerta nueva: se emite `alerta:confirmada` (como antes).
- Alerta corroborada: se emite `alerta:actualizada` (no `alerta:confirmada`, para no
  hacer pensar que es un incendio distinto) con el mismo shape de `GET /alertas/:id`,
  reflejando el `puntaje` nuevo. No se vuelve a notificar a las instituciones ni se
  recalculan rutas: ya se hizo cuando se creó la alerta original.

## Sugerencia de cómo debería ser la vista

- No se necesita UI nueva para el ciudadano: el flujo de enviar reporte es el mismo y
  siempre debe mostrar `alerta_vinculada` igual (haya sido nueva o corroborada).
- Si se quiere distinguir visualmente en el panel central/institucional (opcional, no
  bloqueante): al recibir `alerta:actualizada` para una alerta que el frontend ya tenía
  en su lista de activas (en vez de `alerta:confirmada` para una nueva), se puede mostrar
  un indicador sutil como "+1 reporte corrobora esta alerta" junto al `puntaje`
  actualizado, en vez de tratarlo como una alerta nueva en el mapa/listado.
