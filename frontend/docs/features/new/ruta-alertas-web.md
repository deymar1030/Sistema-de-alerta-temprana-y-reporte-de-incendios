# Feature: Ruta de alertas para jefe de institución y ADMIN

#### Detalle:
implementación web sobre `frontend-santiago`, actualizada a `f8327ee` antes de los
cambios. El jefe consulta el recorrido desde su institución junto al formulario de
asignación existente. El administrador general elige una institución notificada y
consulta su recorrido desde el detalle de la alerta.

Esta entrega consume datos del backend. No modifica el cálculo de rutas, no crea
notificaciones nuevas para ADMIN y no incorpora rutas en la aplicación móvil ni en
el detalle del rol OPERATIVO. La asignación de personal que ya existía en la web se
conserva.

## Métodos usados

Get: `api/alertas/:id`
- Consulta el detalle y `instituciones_notificadas`.
- El jefe utiliza el envío cuyo `id_institucion` corresponde a su sesión.
- ADMIN elige explícitamente entre las instituciones notificadas; no se selecciona
  automáticamente la primera.
- El envío puede incluir estos campos adicionales:

```json
{
  "id_institucion": 3,
  "nombre": "Institución de ejemplo",
  "ruta": {
    "origin": { "latitude": -16.5, "longitude": -68.15 },
    "destination": { "latitude": -16.501, "longitude": -68.151 },
    "distance_m": 180,
    "geometry": [[-16.5, -68.15], [-16.501, -68.151]]
  },
  "ruta_calculada_en": "2026-11-04T18:00:03.000Z",
  "ruta_error": null
}
```

El ejemplo ilustra el contrato, no un recorrido real comprobado. Las coordenadas de
`geometry` son `[latitud, longitud]`. No se convierten a GeoJSON.

«Actualizar ruta» repite el GET; no recalcula el recorrido. Con `ruta: null`, sin
error y sin fecha del intento, se consulta cada 3 segundos hasta 10 veces. La consulta
se pausa mientras la pestaña está oculta y se detiene al recibir ruta/error, agotar
intentos, fallar el GET, terminar la alerta o salir del panel. Si el backend omite
los campos de ruta, se muestra que no hay recorrido disponible y no se inicia polling.

Get: `api/usuarios/operativos` y Post: `api/notificaciones/asignaciones`
- Se conserva el flujo de Santiago para el jefe: consultar disponibilidad y asignar
  únicamente a los seleccionados.
- Actualizar la alerta no borra la selección válida del mismo contexto; cambiar de
  alerta o sesión la limpia. Respuestas atrasadas no modifican otro detalle.
- Los cambios de estado de la atención siguen el flujo operativo existente.

## Vista implementada

| Antes | Después | Motivo |
| --- | --- | --- |
| Detalle del jefe con datos y asignación en bloques verticales. | Resumen, mapa principal y personal en dos columnas en escritorio. | Relacionar destino y personal en una misma tarea. |
| ADMIN consulta los datos e instituciones notificadas. | «Ver alerta y rutas» abre un modal amplio con selector de institución y mapa. | Supervisar cada origen sin asumir una ruta única para toda la alerta. |
| Sin visualización del recorrido en Santiago. | Marcadores A/B, distancia, fecha, encuadre completo y ampliación dentro del panel. | Identificar claramente salida, destino y datos del cálculo. |
| Recargar el detalle lo elimina temporalmente. | Conservar el detalle y el mapa mientras se actualiza el mismo contexto. | Mantener selección y orientación. |

Acceso del jefe: **Alertas recibidas → Ver alerta y ruta**.

Acceso de ADMIN: **Alertas → Ver alerta y rutas → Institución de origen**.

- Diseño de una columna en pantallas pequeñas y mapa adaptable al ancho disponible.
- Se validan coordenadas, geometría y distancia antes de dibujar. Un recorrido de un
  solo nodo y distancia cero es válido.
- El encuadre incluye la línea y ambos puntos, incluso si los extremos exactos quedan
  fuera de la red vial. Se informa cuando hay más de 25 m de separación aproximada
  entre un punto y el extremo de la geometría; no se inventa un tramo adicional.
- Sin recorrido, se muestra el destino conocido. Sin coordenadas, un estado vacío.
- Fallos de teselas, error de cálculo y datos inválidos tienen mensajes diferenciados.
- La distancia se expresa en metros o kilómetros. No se muestra ETA ni navegación GPS.
- Botones con foco visible, marcadores A/B, texto equivalente fuera del mapa y cierre
  del modal con Escape y restauración de foco.

## Archivos modificados

- `src/components/alerts/AlertRoutePanel.vue`: selección, datos del envío y actualización acotada.
- `src/components/alerts/AlertRouteMap.vue`: Leaflet, encuadre, marcadores y ampliación.
- `src/utils/alert-route.ts`: validación, selección del envío y formatos.
- `src/services/backend-alerts.service.ts`: contrato de rutas y cancelación del GET de detalle.
- `src/views/InstitutionAlertDetailView.vue`: composición y protección frente a respuestas atrasadas.
- `src/views/InstitutionAlertsView.vue`: enlace al recorrido para el jefe.
- `src/views/SuperAdminAlertsView.vue`: panel compartido dentro del detalle administrativo.
- `tests/alert-route.test.mjs`: casos de validación del contrato y selección institucional.

## Comprobación

Desde `frontend`, con Node 24:

```powershell
npm run build
node --experimental-strip-types --test tests/alert-route.test.mjs
```

La compilación y los 6 tests pasaron. Vite informa avisos de tamaño de bundle e imports
estáticos/dinámicos compartidos; no impiden compilar.

Pasaron 24 comprobaciones de UI con Chromium y respuestas REST controladas: jefe, ADMIN, selección de
institución, refresco sin desmontar el mapa, selección de personal conservada, ruta que
llega después, error, geometría inválida, coordenadas ausentes, contrato antiguo,
alerta terminada, ampliación/reducción, ancho de 360 px, respuesta atrasada después de
cambiar institución, límite de diez consultas automáticas y exclusión de OPERATIVO del
panel nuevo. No se realizaron escrituras contra la API real.

Para validar con el despliegue, abrir una alerta cuyo envío ya contenga `ruta` y
contrastar origen/destino con los datos de esa institución. Esta revisión no certifica
la precisión vial de una alerta real ni que el backend desplegado ya entregue el contrato.
