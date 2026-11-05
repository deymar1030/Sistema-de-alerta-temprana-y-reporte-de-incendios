# Mapas de alertas en dashboards web

## Objetivo

Mostrar alertas activas junto a las instituciones en el dashboard ADMIN. Para JEFE_INSTITUCION, limitar el mapa a su institución y a las alertas dirigidas a ella. Implementación en `REPOSITORIO ORIGINAL/frontend`, rama `frontend-santiago`.

## Diagnóstico y cambios

| Antes | Después | Motivo |
| --- | --- | --- |
| Ambos dashboards desactivaban las alertas del mapa. | Consulta de `GET /alertas/mapa`. | Mostrar las alertas actuales con sus ubicaciones reales. |
| El mapa institucional mostraba todas las instituciones. | Filtro obligatorio por institución; sin ID no se consulta ni se muestran datos. | Mantener el alcance del jefe. |
| El mapa estaba al final o en media columna. | Mapa de ancho completo tras los indicadores. | Facilitar la lectura territorial antes del historial. |
| No había actualización de ubicaciones en el dashboard. | Consulta cada 30 s con la pestaña visible, actualización al regresar y botones manuales. | Incorporar nuevas alertas y retirar las terminadas. |
| Marcadores sin distinguir claramente el tipo de dato. | Círculo rojo con signo de alerta y cuadrado gris para institución, leyenda y ventanas de detalle. | Distinguir por forma y texto, además del color. |

Diseño: panel institucional claro para supervisión, conservando tipografía y controles existentes. Variación 3/10, movimiento 1/10, densidad 6/10; se priorizan lectura, foco y espacio del mapa.

## Alcance funcional

- ADMIN consulta `/alertas/mapa` y muestra las instituciones registradas con coordenadas válidas, incluyendo su estado y disponibilidad.
- JEFE consulta `/alertas/mapa?id_institucion=<id>` y filtra las instituciones por su ID. El backend debe mantener la autorización y el filtro de envíos institucionales; el filtro visual no sustituye esos permisos.
- Alertas actuales: `EN_EVALUACION`, `CONFIRMADA`, `ATENDIDA`, conforme al endpoint existente. `CERRADA`, `DESCARTADA` y `CANCELADA` no se dibujan. El historial sigue en Actividad reciente y en la lista de alertas.
- Se admiten varias ubicaciones por alerta, eliminando coordenadas repetidas de la misma alerta. El contador representa alertas, no marcadores.
- Se avisa de registros sin coordenadas válidas. No se asignan puntos aproximados ni se convierten valores nulos en coordenadas.
- El encuadre inicial incluye todos los puntos; la actualización periódica respeta el zoom. “Ver todo” permite volver a encuadrar.
- Ante un error se retiran los marcadores de la fuente que falló y se mantiene la otra fuente, con un aviso explícito. No se presentan datos antiguos como actuales.
- Un cambio de contexto invalida respuestas pendientes y limpia los marcadores. Al salir se cancelan el temporizador, la consulta de alertas y los observadores.
- Los popups usan texto seguro y navegación interna. El jefe puede abrir el detalle y la ruta; ADMIN puede acceder a la lista de alertas y consultar sus rutas existentes.

## Archivos y elaboración

1. Extender `backend-alerts.service.ts`: `map(institutionId?, signal?)`, conservando llamadas existentes sin argumentos y rechazando IDs vacíos explícitos.
2. Añadir `utils/dashboard-map.ts` para validar coordenadas, filtrar instituciones y preparar ubicaciones activas.
3. Añadir `components/dashboard/DashboardAlertsMap.vue`: consultas, refresco, control de contexto, marcadores Leaflet, estados de carga/error/vacío, leyenda y encuadre.
4. Integrarlo en `SuperAdminDashboardView.vue` con `scope="admin"` y en `InstitutionAdminDashboardView.vue` con `scope="institution"` e ID del usuario. Los botones generales también actualizan el mapa.
5. Mantener `MonitoringMap.vue` para sus demás consumidores; no cambiar backend, app móvil ni asignaciones a operativos.

## Validación

- `npm run build` para tipos y compilación.
- `node --experimental-strip-types --test tests/alert-route.test.mjs tests/dashboard-map.test.mjs` para rutas existentes, coordenadas, alcance y estados activos.
- Navegador con API controlada: ambas cuentas, filtro institucional en la petición, alertas nuevas/cerradas, actualización manual y periódica, datos vacíos, coordenadas ausentes, errores parciales, limpieza al salir y vista móvil.

La actualización es por consulta periódica, no por WebSocket. Las pruebas controladas verifican comportamiento del frontend; la disponibilidad y autorización del backend desplegado deben comprobarse en su entorno.

### Resultado de verificación

- Compilación de producción y TypeScript correctos. Persisten los avisos previos de tamaño del bundle e importaciones estáticas/dinámicas.
- 10 pruebas unitarias aprobadas entre rutas y mapas.
- 28 comprobaciones de navegador aprobadas, sin errores de JavaScript, con REST simulado y sin escrituras a producción. Se comprobó también la carga real del mapa base OpenStreetMap en escritorio y la distribución a 360 px.
