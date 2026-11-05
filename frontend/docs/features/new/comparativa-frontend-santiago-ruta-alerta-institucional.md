# Feature: Coordinación institucional y ruta hacia la alerta, comparativa con frontend-santiago

#### Detalle:
el JEFE_INSTITUCION necesita entender dónde ocurrió una alerta, desde qué institución
sale el recorrido y a qué operativos puede asignarla. Actualmente esos elementos
están en el detalle, pero se presentan como una lista de datos, un mapa pequeño y un
formulario al final. La funcionalidad pertenece a esta pantalla; lo que debe cambiar
es su jerarquía y su integración con la asignación del personal.

La propuesta es convertir `/institucion/alertas/:id` en una pantalla de coordinación:
resumen de la alerta arriba, recorrido como contenido principal y personal al lado.
El dashboard sigue siendo el resumen institucional y el listado permite elegir una
alerta. No hace falta crear un módulo independiente de «Rutas».

Este documento describe modificaciones pendientes; no representa una UI ya
implementada. Sigue la estructura de las features existentes: detalle, métodos usados
y sugerencia de vista, añadiendo la comparación y los pasos de integración.

## Alcance ampliado: entregar la alerta y su ruta a los responsables

Además de mejorar el detalle web, el objetivo incluye que el operativo asignado pueda
abrir su alerta y consultar el recorrido, y que los administradores reciban el aviso
y puedan supervisarlo. Aquí se distingue **JEFE_INSTITUCION** de **ADMIN**, administrador
general. La ruta pertenece al par alerta/institución: una misma alerta puede tener
varios recorridos porque cada institución parte de un origen diferente.

| Destinatario | Estado comprobado | Comportamiento objetivo |
| --- | --- | --- |
| JEFE_INSTITUCION | `distribuirAlerta.js` crea una notificación para los jefes activos de las instituciones destinatarias. La ruta se calcula por separado y el detalle web ya la consulta. | Recibir la alerta y abrir el detalle con el recorrido de su institución; actualizarlo cuando el cálculo termine. |
| OPERATIVO asignado | La asignación persiste la relación y genera una notificación individual con `id_alerta`; el DTO de notificación no incluye geometría. Los servicios móviles revisados no incorporan `ruta`. | Al abrir la notificación o su lista de asignaciones, consultar el detalle y mostrar la ruta de su institución junto al destino y la distancia. |
| ADMIN | El bloque de distribución revisado crea notificaciones personales para jefes, no para ADMIN. Esto es distinto de los eventos generales de alertas del sistema de tiempo real. | Incorporar notificación persistida de alerta confirmada para administradores activos; abrir el detalle administrativo y elegir la institución cuyo recorrido se desea supervisar. |

### Entrega propuesta

1. Confirmar y distribuir la alerta: persistir sus envíos y notificaciones a jefes y
   administradores. Enviar el aviso sin esperar que termine el cálculo vial.
2. Calcular y guardar cada recorrido en el envío institucional existente. No crear
   copias de la geometría por usuario o por notificación.
3. Cuando el jefe asigna personal, notificar solamente a los operativos elegidos.
   La notificación contiene la referencia de alerta y abre su detalle autorizado.
4. Al abrir el detalle, consultar `GET /api/alertas/:id`. Para jefe y operativo,
   resolver el envío propio desde la sesión. Para ADMIN, ofrecer selección explícita
   entre las instituciones notificadas, mostrando origen, destino y fecha del cálculo.
5. Si la ruta no está disponible, mostrar el estado correspondiente y consultar de
   forma acotada. Como mejora posterior, emitir un evento de actualización de ruta
   después de persistirla para refrescar los clientes interesados sin otra notificación
   de emergencia. Ese evento específico todavía no está implementado.

Así, «enviar la alerta con su ruta» significa que el aviso permite acceder a ambos
datos, aunque el recorrido termine de calcularse después. No implica adjuntar toda la
polilínea al mensaje ni retrasar una alerta por un fallo del servicio de rutas.

### Cambios adicionales necesarios

- **Backend:** ampliar destinatarios persistidos de la alerta confirmada a usuarios
  ADMIN activos, con deduplicación por alerta/destinatario ante reintentos. Conservar
  la asignación individual de OPERATIVO y no avisar a todo el personal indiscriminadamente.
- **Autorización del detalle:** validar en servidor el acceso por actor. Para el flujo
  de atención del operativo, comprobar su asignación y su institución; el frontend no
  debe resolver permisos solamente filtrando un array recibido. ADMIN puede supervisar
  los envíos institucionales según su permiso general de consulta.
- **Móvil:** extender contratos y el detalle operativo para consumir `ruta`,
  `ruta_error` y `ruta_calculada_en`, y enlazar notificaciones/asignaciones con ese
  detalle. Revisar `frontend-mobile/src/services/institution-alert.service.ts` y
  `incident.service.ts`: actualmente no mapean la ruta. El primero asigna
  `distanceKm: 0`, que debe sustituirse por distancia real o ausencia de dato.
- **Web administrativa:** incorporar selector de institución y mapa al detalle de
  alerta de ADMIN. No elegir silenciosamente el primer envío ni calcular una ruta
  desde la ubicación del administrador.
- **Actualización:** limpiar suscripciones/consultas al salir y evitar duplicar avisos
  al reconectar. La notificación persistida y el GET permiten recuperar información
  aunque el usuario no estuviera conectado cuando se emitió el evento.

El origen de todos estos recorridos sigue siendo la sede institucional. Una ruta desde
el GPS actual del operativo sería otra funcionalidad, con un origen y un cálculo distintos.
Esta ampliación se documenta como trabajo pendiente de backend, web y móvil.

## Referencias y alcance de la comparación

Revisión realizada el **4 de noviembre de 2026**, mediante código y contratos locales.
No se verificó una sesión autenticada en navegador ni un recorrido real en pantalla.
Los problemas visuales se deducen de la estructura del template; los de geometría se
separan de los de presentación para no atribuirles una causa sin comprobarla.

| Referencia | Versión revisada | Qué representa |
| --- | --- | --- |
| Rama remota `origin/frontend-santiago` | `f8327ee7f41a4155fee8031ca962fe1c1b737418`, 03-nov-2026 | Incluye `61c24ea` y `f8327ee`: integración de features, modal de alertas, perfil, lecturas y mapa de predios. |
| Rama local `feat/deteccion-imagen-backend` | HEAD `9b2af93`, 04-nov-2026 | Base confirmada del repositorio actual. |
| Frontend actual | HEAD más archivos modificados y archivos nuevos del directorio de trabajo | Incluye el mapa de ruta y la implementación local de auditoría, todavía sin confirmar en Git. |

Se ejecutó `git ls-remote` y `git fetch --no-tags origin frontend-santiago`: la
referencia local anterior, `5760d84`, estaba atrasada. La comparación utiliza la
versión remota actualizada, sin cambiar de rama ni fusionar archivos.

Para reproducir la revisión desde la raíz:

```powershell
git log -1 --oneline origin/frontend-santiago
git diff origin/frontend-santiago HEAD -- frontend
git diff HEAD -- frontend
git diff origin/frontend-santiago -- frontend
git ls-files --others --exclude-standard frontend
```

El último comando es necesario: `git diff` no incluye el contenido de archivos sin
seguimiento. Por ejemplo, `frontend/src/views/AuditView.vue` existe localmente sin
seguimiento; una diferencia que lo marque eliminado respecto a Santiago no significa
que falte físicamente. También existen `auditoria.md` y `auditoria.pdf` locales nuevos.

## Qué tiene cada frontend y qué conviene integrar

Las rutas de archivos de esta sección son relativas a `frontend/`.

| Funcionalidad | frontend-santiago | Frontend actual, incluyendo cambios locales | Modificación recomendada |
| --- | --- | --- | --- |
| Ruta vial institucional | El detalle no renderiza rutas y su servicio no declara `RouteInfo`. | Declara `ruta`, `ruta_error`, `ruta_calculada_en` y dibuja con Leaflet la geometría recibida. Esta incorporación es local, no está en HEAD. | Conservar el contrato y el recorrido actual; extraer el mapa y reorganizar el detalle. No sustituir el archivo completo por el de Santiago. |
| Asignación de operativos | `operative-assignment.service.ts`; valida IDs, exige `disponible === true`, distingue carga/error/vacío, descarta selecciones que dejaron de estar disponibles y bloquea alertas terminadas. | `userService.getOperativos()` + `notificationService.asignarAlerta()`; formulario básico. Un valor ausente de disponibilidad se interpreta como disponible (`!== false`). | Adoptar el servicio específico y los estados de Santiago como implementación única. Integrarlos con el mapa y conservar la protección frente a respuestas antiguas. |
| Navegación entre detalles | Observa `route.params.id` y recarga. | Solo carga en `onMounted`; observa cambios de `ruta`, pero no del ID de navegación. | Observar ID de alerta e institución, limpiar selecciones al cambiar de contexto y descartar respuestas del contexto anterior. |
| Disponibilidad institucional | Solo el jefe puede cambiarla; muestra avisos de falta de personal y confirmación del efecto. Normaliza `null` como `DISPONIBLE`. | Ya tiene PATCH y botón, pero la vista compartida con OPERATIVO no condiciona ese botón al rol. Normaliza `null` como `NO_DISPONIBLE`. | Recuperar la restricción visual por rol, los avisos y la normalización correcta. Unificar `setAvailability`/`updateAvailability` con `setDisponibilidad`, sin conservar dos circuitos. |
| Informes de atención | Comprueba categoría BOMBEROS, mantiene consulta para otras categorías, envía `id_alerta` numérico y explica que completar cierra la alerta y libera personal. | `canWrite` depende de tener institución/usuario; el tipo de creación aún pide `id_institucion` e `id_usuario` y `id_alerta` string. | Integrar conjuntamente `report.service.ts` e `InstitutionReportsView.vue` de Santiago, conservando validaciones del servidor. |
| Auditoría | API real para AUDITOR; `clear()` en store y limpieza al salir; ADMIN tiene un aviso sin consultar endpoints restringidos. El layout evita cargar notificaciones/instituciones para AUDITOR. | También consume API real, con tipos y métodos de otros nombres, y conserva `ip_origen`. El router permite que ADMIN monte `AuditView`, aunque el backend rechaza las consultas. | Conciliar vista, servicio y store como conjunto; mantener `ip_origen`, incorporar limpieza, aislar AUDITOR y evitar llamadas de ADMIN que terminan en 403. No mezclar métodos de stores incompatibles. |
| Permisos de personal | `/institucion/usuarios` usa `headRoles`. | Usa `institutionRoles`, incluyendo OPERATIVO aunque su menú no muestre el enlace. | Recuperar el guard de jefe y probar el acceso por URL, además de la navegación visible. |
| Edición de perfil | Añade `AccountProfileForm.vue`, `profile.service.ts`, `auth.refreshProfile()`, apellidos separados y acceso «Editar mis datos». | Configuración contiene secciones estáticas; no existe ese componente ni servicio. | Integrar el conjunto de archivos, condicionado a resolver la autorización de edición propia en backend descrita más abajo. |
| Mapa de predios | `PrediosDirectoryMap.vue`, alternador «Ver mapa», coordenadas validadas y selección de un predio desde el mapa filtrado. | Tiene el directorio y el selector de ubicación, pero no ese mapa de directorio. | Incorporar componente e integración en `PrediosView.vue`. No confundirlo con el mapa del recorrido institucional. |
| Lecturas de sensores | Añade indicadores de los resultados, etiquetas de estado y consulta cada 60 s con pestaña visible; limpia el temporizador al salir. | Tabla con filtros/paginación y actualización manual. | Integrar mejoras de `ReadingsView.vue`; conservar que los indicadores corresponden a la página filtrada, no a toda la base. No presentarlo como WebSocket. |
| Alertas de administración | Detalle en modal, control de foco y versión de solicitud para evitar respuestas atrasadas. | Detalle integrado en la página de `SuperAdminAlertsView.vue`. | Integrar el modal para consulta administrativa. El detalle del jefe necesita espacio estable para mapa y asignación; conservar allí una página propia. |
| Documentación y dependencias | No contiene la carpeta de features existente en la rama local con sus documentos confirmados. | Contiene las guías de disponibilidad, asignación, cierre y corroboración, además de auditoría local. | Conservar la documentación. `package.json` y `package-lock.json` no difieren entre estas referencias: estas mejoras no requieren cambiar de framework ni añadir otra librería de mapas. |

La revisión del diff de `frontend/src` no muestra una mejora adicional del CRUD
`SensorsView.vue` entre estas versiones. El cambio de sensores visible en Santiago
está en `ReadingsView.vue`; no deducir funciones nuevas únicamente del título del commit.

## Diagnóstico del detalle actual

Fuente principal: [InstitutionAlertDetailView.vue](../../../src/views/InstitutionAlertDetailView.vue).

| Antes, observado en el código actual | Después, propuesto | Por qué |
| --- | --- | --- |
| Título genérico «Detalle institucional» y varios párrafos antes del mapa. | Encabezado «Alerta #ID», lugar, clasificación y dos estados identificados; fechas secundarias en detalles. | Permite identificar el incidente y diferenciar el estado global del envío institucional. |
| Mapa de 320 px dentro de una única tarjeta, antes del formulario de personal. | Área principal de recorrido y columna de asignación en escritorio. | Relaciona destino, acceso y personal dentro de la misma tarea. |
| Enlace del listado «Ver estado del envío». | «Ver alerta y ruta», con asignación dentro del detalle para el jefe. | El acceso comunica lo que realmente se puede hacer. |
| Origen/destino solo se explican en popups; la polilínea y el destino son rojos. | Etiquetas persistentes A/B y resumen textual; recorrido diferenciado del marcador de emergencia. | El significado no depende de abrir marcadores ni de reconocer colores. |
| `load()` pone `item = null` en cada actualización; el mapa se elimina y reconstruye. | Separar carga inicial de actualización; mantener el contenido anterior del mismo ID y actualizar capas. | Evita saltos, pérdida del encuadre y desaparición temporal del formulario. |
| Sin ruta ni error siempre dice «Calculando ruta». | Estado «Ruta aún no disponible», consulta acotada y mensaje definitivo si no llega. | Dos campos nulos no prueban que exista un trabajo en ejecución. |
| `fitBounds` usa solo la geometría; no hay validación en tiempo de ejecución. | Validar geometría y encuadrar recorrido más ambos puntos. | Los extremos exactos pueden estar fuera de los nodos de la red vial; una geometría inválida no debe romper el detalle. |
| Se muestra `ruta_error` técnico directamente. | Mensaje operativo comprensible y detalle técnico secundario, si resulta útil. | La persona necesita saber si puede consultar el lugar y continuar la asignación. |
| «Esta vista solo consulta datos persistidos», junto a un formulario que asigna personal. | Explicar que la web permite coordinar personal y consultar la ruta; los estados de atención siguen su flujo existente. | El texto debe describir las acciones reales. |
| No hay estados separados de carga/error/vacío de personal ni bloqueo por alerta terminada. | Adoptar esos estados de Santiago y deshabilitar selección/envío durante una asignación. | Evita falsas listas vacías, confirmaciones con cantidades cambiantes y acciones improcedentes. |

### Si el recorrido parece no llegar al lugar

El [servicio de rutas](../../../../backend/routing-service/router.py) recibe las
coordenadas exactas y busca los nodos viales más cercanos con `nearest_nodes`.
Dijkstra calcula sobre esos nodos con `weight="length"`. La respuesta conserva las
coordenadas exactas en `origin` y `destination`, pero `geometry` describe la red vial.
Por eso puede existir separación entre un marcador y el inicio/final de la línea.
Es una explicación posible basada en el algoritmo, no una falla geográfica comprobada
con una alerta concreta durante esta revisión.

La modificación debe mostrar ambos extremos reales y el tramo calculado. Si existe
separación, informar «El recorrido vial termina cerca del punto reportado»; no extender
la polilínea sólida como si se hubiese calculado una calle hasta la puerta. Si se dibuja
una conexión auxiliar discontinua, identificarla como referencia sin recorrido calculado
y no sumarla a `distance_m`.

Para diagnosticar una alerta concreta, contrastar la institución de `myDelivery`,
las coordenadas de `ruta.origin`/`ruta.destination`, las del predio o reporte y los
extremos de `geometry`. Si las coordenadas guardadas son incorrectas, mover la UI no
resuelve el problema: corresponde corregir el dato y definir el recálculo en backend.

## Métodos usados

### Consultar alerta y recorrido

Get: `api/alertas?id_institucion=:id`
- Ya consumido por `backendAlertsService.byInstitution()`. Alimenta el listado
  institucional; la identidad de institución se obtiene de la sesión.

Get: `api/alertas/:id`
- Ya consumido por `backendAlertsService.detail()`; no requiere body.
- Response: `data` contiene la alerta y `instituciones_notificadas`.
- Seleccionar el envío cuya `id_institucion` coincide con la institución autenticada,
  normalizando ambos IDs con `String()`. No tomar el primer elemento del array.
- Si no hay envío propio, no presentar el recorrido de otra institución.
- Ejemplo parcial e ilustrativo del contrato, no una ruta real verificada:

```json
{
  "id_alerta": 7,
  "estado": "CONFIRMADA",
  "clasificacion": "INCENDIO",
  "instituciones_notificadas": [
    {
      "id_institucion": 3,
      "nombre": "Institución de ejemplo",
      "estado": "ENVIADA",
      "fecha_envio": "2026-11-04T18:00:00.000Z",
      "fecha_actualizacion": null,
      "ruta": {
        "origin": { "latitude": -16.5, "longitude": -68.15 },
        "destination": { "latitude": -16.501, "longitude": -68.151 },
        "distance_m": 180,
        "geometry": [[-16.5, -68.15], [-16.501, -68.151]]
      },
      "ruta_calculada_en": "2026-11-04T18:00:03.000Z",
      "ruta_error": null
    }
  ]
}
```

Contrato definido en [backend-alerts.service.ts](../../../src/services/backend-alerts.service.ts)
y [ResponseInstitucionNotificadaDTO](../../../../backend/api/domain/envia/dtos/responseEnvia.dto.js).
El backend también puede entregar metadatos del grafo que esta UI no necesita.

- `geometry` usa **[latitud, longitud]**, compatible con la polilínea actual de
  Leaflet. No invertirlo como si fuese GeoJSON.
- `distance_m` mide longitud vial. Mostrar metros para distancias menores a 1 km y
  kilómetros para las mayores, con formato local. No convertir la distancia en un ETA.
- `ruta_calculada_en` se escribe al persistir el resultado o el error. Solo etiquetarlo
  «Ruta calculada» cuando exista una ruta válida; en error es la fecha del intento.
- El origen es la institución; no es la posición GPS de un operativo o vehículo.
- La ruta es la de menor longitud en el grafo cacheado de La Paz/El Alto. No garantiza
  menor tiempo, tráfico actualizado, ausencia de bloqueos ni acceso de un vehículo específico.

No existe en el router actual un endpoint público para recalcular esta ruta. El botón
**«Actualizar ruta» vuelve a consultar el detalle**; no debe prometer recalcularla.
El navegador tampoco debe llamar directamente al microservicio Python.

### Estados de la ruta

| Condición | Presentación y acción |
| --- | --- |
| Primera consulta pendiente | «Consultando alerta», espacio reservado para el mapa; no mostrar una lista vacía como resultado definitivo. |
| Ruta válida | Recorrido, extremos, distancia y fecha de cálculo. Acciones «Ver recorrido completo» y «Ampliar mapa». |
| `ruta` nula y `ruta_error` nulo | «Ruta aún no disponible». Consultar cada 3 s, hasta 10 consultas automáticas por contexto como propuesta inicial configurable. |
| Sigue sin ruta al terminar las consultas | «La ruta aún no está disponible. Puedes volver a consultar». Detener el temporizador; mantener actualización manual. |
| Faltan coordenadas conocidas | «No hay coordenadas suficientes para mostrar el recorrido». Mostrar el lugar conocido; no inventar puntos ni afirmar que el cálculo sigue ejecutándose. |
| `ruta_error` presente y sin ruta válida | «No se pudo obtener el recorrido vial». Mostrar el destino si se conoce; la asignación sigue teniendo sus reglas propias. Actualizar consulta, no recalcula. |
| Geometría vacía, coordenadas fuera de rango, datos no finitos o distancia negativa | No dibujar la línea. Aviso de datos de ruta inválidos sin bloquear el resto del detalle. |
| Geometría de un solo punto y distancia cero | El backend contempla origen y destino asociados al mismo nodo. Mostrar puntos y encuadre con zoom máximo razonable; no tratarlo automáticamente como un error. |
| Falla la actualización de una alerta ya visible | Conservar los datos de ese mismo contexto con aviso de que no se actualizaron. No presentar como recién verificados los datos anteriores. |

El cálculo se lanza en segundo plano en
[calcularRutasEnvios.js](../../../../backend/api/application/alerta/calcularRutasEnvios.js).
Si faltan coordenadas, [distribuirAlerta.js](../../../../backend/api/infrastructure/features/alerta/distribuirAlerta.js)
no agrega el envío a `rutasPendientes`. Por ello, `null/null` también puede significar
que no se programó un cálculo, además de un cálculo pendiente o una alerta antigua.
Con el contrato actual no se puede distinguir siempre esos casos.

El código que persiste la ruta no emite un evento específico de «ruta lista».
La primera implementación puede usar consulta acotada. Pausarla con la pestaña oculta,
impedir peticiones superpuestas y detenerla al salir, cambiar de alerta/institución,
cerrar sesión, recibir ruta/error o agotar intentos. Ante 401/403, detener consultas
y aplicar el manejo de sesión/permisos, sin mantener información de otro contexto.

### Asignación y disponibilidad

Get: `api/usuarios/operativos`
- Solo JEFE_INSTITUCION; el servidor obtiene la institución de la sesión.
- Devuelve `data` con `id_usuario`, `nombre`, `disponible` e `id_alerta_asignada`, entre
  otros campos. Un valor ausente de `disponible` no habilita asignaciones.
- Contrato y ejemplos completos en [Asignación de operativos](../asignacion-operativos.md).

Post: `api/notificaciones/asignaciones`
- Solo JEFE_INSTITUCION. Reutilizar el servicio específico de Santiago:

```json
{ "id_alerta": 7, "id_usuarios": [12, 13] }
```

- Valida envío a la institución, pertenencia del personal y ocupación en otra alerta
  activa. `data` contiene notificaciones, no una lista completa de asignaciones.
- Tras éxito, recargar disponibilidad. Si hay conflicto, actualizar el personal y
  retirar selecciones inválidas sin repetir automáticamente el POST.
- El bloqueo de asignación en alertas terminadas de Santiago es una validación de UI.
  El use case local `asignarAlertaOperativos.useCase.js` no valida expresamente el
  estado global de la alerta destino; agregar esa regla en backend para garantizarla
  también ante clientes alternativos o cierres concurrentes.

Patch: `api/instituciones/:id/disponibilidad`
- Solo el jefe de la institución indicada. Ejemplo:

```json
{ "disponibilidad_operativa": "NO_DISPONIBLE" }
```

- Response `data`: institución actualizada. Mantener `null` como `DISPONIBLE` al leer.
- La falta de operativos libres genera un aviso, no un PATCH automático.
- Contrato completo en [Disponibilidad de institución](../disponibilidad-institucion.md).

### Otras integraciones de Santiago

| Método | Uso al integrar | Regla que conservar |
| --- | --- | --- |
| `GET /api/instituciones` | Confirmar categoría antes de habilitar informes. | Si no se puede confirmar BOMBEROS, mantener consulta y explicar el estado. |
| `POST /api/informes-atencion`, `PUT /api/informes-atencion/:id` | Crear y completar informes con el flujo de Santiago. | El servidor toma usuario/institución de la sesión. Completar cierra la alerta y libera operativos; ver [contrato](../cierre-alerta-informe-atencion.md). |
| `GET /api/auditoria`, `GET /api/auditoria/usuarios` | Auditoría real de solo lectura. | Exclusivos de AUDITOR según el router local; ADMIN recibe 403. Ver [contrato](../auditoria.md). |
| `PUT /api/usuarios/:id`, `GET /api/auth/me` | Guardar perfil y confirmar la sesión/datos con `refreshProfile()`. | Enviar solo nombre, apellidos, correo y teléfono; resolver autorización en backend antes de habilitar edición propia. |
| `GET /api/predios` | Alimentar el directorio y su mapa filtrado. | Reutilizar `predio.service.ts`; el mapa no necesita otro endpoint. |
| `GET /api/lecturas` | Actualizar la página de lecturas. | Mantener los parámetros de paginación del servicio existente; el polling no sustituye una futura integración de tiempo real. |
| `GET /api/alertas/mapa`, `GET /api/alertas/:id` | Mapa general y detalle administrativo en modal. | El mapa general devuelve ubicaciones; el recorrido por institución se toma del detalle. |

**Pendiente concreto del perfil:** en el backend revisado, `/usuarios` exige sesión,
pero `PUT /usuarios/:id` pasa el ID y el body al servicio sin comprobar edición de
cuenta propia ni restringir campos por actor. La lista permitida del frontend de
Santiago no proporciona esa autorización. Definirla en backend, conservar las
operaciones administrativas autorizadas y verificar que un usuario no pueda modificar
otra cuenta ni sus privilegios mediante edición propia. Además, el controlador ignora
strings vacíos: no prometer que borrar un apellido o teléfono en el formulario elimina
ese dato hasta definir su contrato. No hace falta bloquear el trabajo de rutas por este
pendiente de una feature independiente.

## Sugerencia de cómo debería ser la vista

### Ubicación y navegación

1. Dashboard institucional: disponibilidad, alertas recientes y aviso de personal;
   cada alerta abre su detalle. No poner recorridos simultáneos en el resumen.
2. Alertas recibidas: enlace «Ver alerta y ruta». Adaptar el texto de asignación al rol;
   un OPERATIVO no debe recibir instrucciones para asignar compañeros.
3. Detalle: conservar `/institucion/alertas/:id`, con navegación de vuelta al listado.
   Tanto JEFE como OPERATIVO pueden consultar la ruta según el acceso actual;
   asignar personal sigue siendo una acción exclusiva del jefe.

### Composición propuesta

```text
Alertas recibidas / Alerta #7                          Actualizar
Nombre del lugar o referencia disponible
Estado global · Estado de mi institución · Clasificación

+--------------------------------------+----------------------------+
| Ruta desde mi institución            | Personal de la institución |
| A: nombre de institución             | Asignados a esta alerta    |
| B: lugar de la alerta                | Disponibles para asignar   |
| Distancia · fecha del cálculo        | Selección y estado         |
|                                      |                            |
| Mapa del recorrido                   | Asignar operativos (N)     |
|                                      |                            |
| Ver recorrido completo · Ampliar     | Error o confirmación       |
+--------------------------------------+----------------------------+

Detalles de la alerta: fechas, origen, descripción y puntaje si existe.
```

- Escritorio: dos columnas desde un ancho que permita mapa y panel legibles
  (referencia inicial `xl`), proporción aproximada 2:1 y panel de personal de al menos
  320 px. Usar `minmax(0, ...)` para evitar desbordes.
- Mapa: altura inicial de 480 a 560 px en escritorio; 300 a 360 px en pantallas pequeñas.
  Al ampliar, usar el espacio disponible del viewport y recalcular tamaño de Leaflet.
- Móvil/tablet: una columna, resumen, mapa y personal. Resumen de asignados/disponibles
  junto al encabezado y enlace «Ir a personal» para no obligar a recorrer un mapa largo.
- «Ampliar mapa» puede abrir un diálogo accesible; cerrar con Escape, devolver el foco
  al botón de apertura y evitar dos instancias Leaflet sobre el mismo contenedor.
- Mostrar A/B en marcadores y texto; usar un color de recorrido distinguible de los
  estados de emergencia. Mantener atribución del mapa y datos textuales accesibles.
- Reservar naranja para acciones de la aplicación, rojo para emergencia/error y
  tonos neutros para estructura. Reutilizar Manrope/Segoe UI y los tokens existentes.
- Reducir tarjetas anidadas: encabezado, dos áreas funcionales y detalles secundarios.
  Los datos extensos no deben desplazar la ruta y la asignación fuera del primer área útil.
- Botones de al menos 44 px, foco visible, contraste verificable, mensajes de carga
  con `role="status"` y errores con `role="alert"`. Evitar animaciones decorativas;
  respetar movimiento reducido y ofrecer una forma de salir del mapa con teclado.
- El mapa orienta la coordinación. No añadir tiempos de llegada, vehículos en vivo,
  instrucciones de giro o seguimiento GPS que el contrato no entrega.

## Cómo elaborar las modificaciones

### 1. Consolidar contratos y reglas antes de reorganizar el template

- Conservar `RouteInfo` y los tres campos de ruta de `InstitutionDelivery`.
- Incorporar `operative-assignment.service.ts` desde Santiago y migrar los consumidores
  institucionales. Retirar los métodos duplicados de asignación solo cuando no tengan
  referencias; no eliminar el resto de `user.service.ts` ni `notification.service.ts`.
- Incorporar la normalización y las reglas de disponibilidad de Santiago usando un
  único nombre de método en servicio, store y dashboard.
- Mantener separados estado global, estado del envío y disponibilidad del personal;
  el éxito de una asignación no implica que el incidente esté atendido o cerrado.
- No hacer merge completo por sustitución de archivos: las dos versiones del detalle,
  auditoría y stores tienen lógica distinta que debe conciliarse.

### 2. Extraer el recorrido de la vista

Crear `src/components/institution/InstitutionAlertRouteMap.vue` como componente
propuesto. Recibe la ruta validada, las etiquetas de origen/destino y el estado de
consulta. Emite la petición de actualización; no conoce credenciales ni asigna personal.

- Crear una instancia de mapa al montar y destruirla al desmontar. Cambiar geometría
  y marcadores mediante capas; no crear un mapa nuevo en cada GET.
- Validar puntos finitos y rangos geográficos, distancia no negativa y geometría no
  vacía. No rechazar latitud o longitud cero por separado mediante una prueba falsy.
- Encuadrar geometría y extremos la primera vez, cuando cambia de alerta o al pulsar
  «Ver recorrido completo»; conservar el zoom manual en actualizaciones equivalentes.
- Observar cambios de tamaño y llamar `invalidateSize()` cuando corresponda; limpiar
  observadores y eventos. El mapa de predios de Santiago ofrece una referencia local.
- Dejar visibles lugar, origen, distancia y errores aunque falle la descarga de teselas.
  La indisponibilidad del mapa base no significa que falló el cálculo de ruta.

### 3. Reorganizar y controlar el detalle institucional

Modificar `src/views/InstitutionAlertDetailView.vue` con el encabezado y las dos
columnas propuestas. Puede extraerse el panel de personal a
`src/components/institution/AlertOperativesPanel.vue` si ayuda a separar responsabilidades.

- Tomar de Santiago los estados de personal y `canAssign`, añadiendo el componente de
  recorrido y un estado separado de actualización del detalle.
- Observar el par ID de alerta/institución. Al cambiar, limpiar datos y selección;
  mientras se actualiza el mismo par, conservar el contenido válido anterior.
- Usar una versión de solicitud o cancelación para que una respuesta lenta de la
  alerta A no reemplace la B. Aplicar la misma protección al GET de personal y a las
  confirmaciones de asignación que terminen después de navegar.
- Agregar las consultas acotadas de ruta descritas arriba sin repetir el POST de
  asignación, sin cargar personal en cada consulta de ruta y sin llamadas simultáneas.
- Distinguir «Ya asignado a esta alerta», «Asignado a otra alerta», «Disponible» y
  «Disponibilidad sin confirmar». Capturar IDs/cantidad enviados antes del POST.
- Deshabilitar nuevas asignaciones si la alerta terminó. La ruta histórica puede
  consultarse con su fecha, sin iniciar un ciclo de espera por un nuevo cálculo.
- Ajustar el enlace de `InstitutionAlertsView.vue` y los textos para cada rol.

### 4. Integrar las demás diferencias por grupos completos

| Orden | Archivos/grupo | Validación antes de darlo por terminado |
| --- | --- | --- |
| P0 | Detalle, componente de ruta, asignación, dashboard, disponibilidad y guards institucionales. | Ruta y personal conviven; nunca se muestra la ruta de otra institución ni se asigna desde OPERATIVO. |
| P1 | `report.service.ts` + `InstitutionReportsView.vue`. | BOMBEROS puede completar; otras categorías consultan; confirmación explica cierre y liberación. |
| P1 | `AuditView.vue`, `audit.service.ts`, `audit.store.ts`, `auth.store.ts`, `main.ts`, router y layout. | Unificar nombres; añadir `clear()` si logout lo invoca; preservar `ip_origen`; ADMIN no consulta API restringida. |
| P2 | `AccountProfileForm.vue`, `profile.service.ts`, auth service/store, Settings y enlace en layout. | Implementar autorización propia en backend y confirmar cambios mediante `/auth/me`; no exponer privilegios editables. |
| P2 | `PrediosDirectoryMap.vue` + `PrediosView.vue`. | Filtros y selección coherentes; puntos inválidos contabilizados; tamaño responsive correcto. |
| P2 | `ReadingsView.vue` y modal de `SuperAdminAlertsView.vue`. | Polling limpio, filtros conservados, foco restaurado y respuestas antiguas descartadas. |

No incorporar llamadas a `auditStore.clear()` de Santiago sin adaptar el store local,
que actualmente no lo expone. Tampoco reemplazar la auditoría local por la de Santiago
sin conservar `ip_origen` cuando el backend lo entrega.

## Criterios de aceptación y comprobación

- [ ] Al confirmar una alerta, jefe y ADMIN reciben un aviso persistido sin esperar la ruta.
- [ ] Al asignar, solo los operativos seleccionados reciben el aviso de asignación;
  abrirlo permite consultar la alerta y el recorrido institucional autorizado en móvil.
- [ ] ADMIN puede elegir la institución y distinguir sus recorridos sin asumir un origen propio.
- [ ] Una ruta que llega después del aviso se incorpora al detalle sin duplicar la alerta.
- [ ] Abrir una alerta como JEFE muestra el envío propio, lugar, recorrido y personal.
- [ ] Una alerta con varias instituciones no toma el primer recorrido por defecto.
- [ ] Cambiar A → B rápidamente no mezcla geometrías, selección ni confirmaciones.
- [ ] Actualizar el mismo detalle no borra el mapa ni reinicia el encuadre manual.
- [ ] Ruta inicialmente ausente aparece cuando el GET la devuelve, sin recargar la página.
- [ ] Sin coordenadas, error de ruta, espera agotada y teselas caídas tienen mensajes distintos.
- [ ] Ruta vacía o inválida no rompe la pantalla; ruta de un punto/0 m se maneja correctamente.
- [ ] Ambos marcadores y toda la geometría entran en el encuadre; se explica el acceso
  aproximado cuando la red vial no llega al punto exacto.
- [ ] No se promete ETA, navegación GPS ni recálculo mediante un GET.
- [ ] Un OPERATIVO consulta el detalle sin controles de asignación/disponibilidad ni
  acceso a administración de personal por URL.
- [ ] Personal ocupado, disponibilidad desconocida, error de carga y lista vacía se distinguen.
- [ ] Un conflicto de asignación actualiza disponibilidad sin reenviar la solicitud.
- [ ] Alertas terminadas no aceptan nuevas asignaciones; validar también la regla en backend.
- [ ] El mapa funciona a 360 px y en escritorio, con teclado, foco visible y movimiento reducido.
- [ ] No quedan temporizadores, observadores ni peticiones aplicables a una sesión anterior.
- [ ] Auditoría no deja datos de otra sesión; ADMIN no provoca consultas con 403 previsibles.
- [ ] Compilar desde `frontend` con `npm run build` después de implementar cada grupo coherente.

Para la implementación, priorizar pruebas de comportamiento con respuestas controladas:
ruta pendiente que llega, carrera A/B, geometría inválida, ocupación concurrente y roles.
Comprobar visualmente el recorrido con datos reales conocidos y contrastar sus extremos;
una compilación correcta por sí sola no valida ubicación, accesibilidad ni legibilidad.

**Estado de esta entrega:** comparación de código, revisión de contratos y propuesta
documentada. No se modificaron componentes ni se ejecutaron pruebas funcionales de la
aplicación para esta entrega de documentación.
