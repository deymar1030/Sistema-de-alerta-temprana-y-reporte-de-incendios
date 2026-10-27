# Guía: arquitectura de tiempo real (MQTT + WebSockets)

Este documento define dónde vive cada responsabilidad
para implementar la ingesta MQTT (`TopicosMQTT.md`) y los WebSockets
(`EndpointsWebSockets.md` §2) **sin mezclarlas** ni romper la Clean
Architecture que ya sigue el resto del backend (ver `GuiaEndpoints.md`).
Es la continuación natural de esos dos documentos: ahí se definió *qué*
tópicos/eventos existen; acá se define *cómo* se implementan por dentro.

## 0. Los tres servicios, a nivel de carpeta

`backend/` deja de tener un único `src/` y pasa a tener **tres carpetas
hermanas**, una por cada forma en que algo entra o sale del sistema:

```
backend/
  api/               (RENOMBRADO desde src/) — HTTP: Express, Clean Architecture completa
  mqtt/              (NUEVO) — consumidor MQTT: entra por el broker, no por HTTP
  websocketManager/  (NUEVO) — Socket.IO: sale por WebSocket, no por HTTP
  app.js             (ya existe) — arranca los tres
```

**Por qué `mqtt` y `websocketManager` no viven adentro de `api/interfaces/`**
(como se había planteado en la primera versión de este documento): porque
no son HTTP. `api/interfaces/` es específicamente la capa de entrega HTTP
(`Roter`s de Express). MQTT y WebSockets son *otras* formas de entrega, así
que se les da su propia carpeta al mismo nivel que `api`, no una subcarpeta
dentro de ella.

**Por qué no son tres servicios totalmente independientes:** `mqtt` y
`websocketManager` **no reimplementan** las reglas de negocio ni el acceso
a datos — ambos importan directamente de `api/domain` y `api/application`
(entidades, casos de uso, interfaces de repositorio) y de los repositorios
ya implementados en `api/infrastructure`. La única razón de que existan
como carpetas propias es que cada uno habla un protocolo distinto (MQTT,
WebSocket) que no es HTTP — el negocio es uno solo y vive en `api/`.

## 1. `api/` (renombre de `src/`)

Sin cambios de fondo respecto a lo que ya existe — sigue siendo
`domain/ → application/ → infrastructure/ + interfaces/` tal como describe
`GuiaEndpoints.md`. Lo único nuevo son dos features que hoy no están
completas:

| Capa | Carpeta dentro de `api/` | Contiene |
|---|---|---|
| Domain | `domain/lectura/` | `entities/lectura.entity.js`; `dtos/validarLecturaMqtt.dto.js` (valida la forma cruda del payload: `valor` numérico, `fecha_hora` ISO) |
| Domain | `domain/motorDeteccion/` **(nuevo)** | Toda la matemática del PDF, en funciones/clases puras, sin IO: `filtroHampel.js` (ec. 1-2), `cusum.js` (ec. 3), `theilSen.js` (ec. 4), `contrasteVecinos.js` (ec. 5), `puntajeAlerta.js` (ec. 6-7), `clasificarAlerta.js` (Tabla 10). Se testea sin DB ni broker. |
| Application | `application/lectura/` | `repositories/lectura.repository.js` (interfaz); `useCases/registrarLectura.useCase.js` (Tabla 5: rango físico + marca de tiempo); `useCases/evaluarLectura.useCase.js` (orquesta: historial → `domain/motorDeteccion` → decide `VALIDA`/`ANOMALA` → abre/reevalúa/confirma/descarta alerta → llama al `realtimeNotifier`, ver §3) |
| Application | `application/alerta/` | `repositories/alerta.repository.js` — el mismo que usaría cualquier endpoint REST de alertas |
| Application | `application/realtime/ports/realtimeNotifier.port.js` **(nuevo)** | La interfaz que **tanto `api` como `mqtt`** usan para avisar que pasó algo, sin saber que existe Socket.IO — ver §3 |
| Infrastructure | `infrastructure/features/lectura/`, `infrastructure/features/alerta/` | Implementación Prisma de los repositorios de arriba |
| Interfaces | `interfaces/features/*Roter/` | Los endpoints REST ya definidos en `EndpointsWebSockets.md` §1 (predios, sensores, alertas, envíos, reportes, informes de atención, etc.) |

`api/` es un paquete Express completo y autónomo: se puede levantar solo,
sin `mqtt` ni `websocketManager`, y los endpoints REST funcionan (salvo
los que necesiten avisar por WebSocket, que simplemente no emitirían nada
si `websocketManager` no está montado — ver §4).

## 2. `mqtt/` (consumidor MQTT)

| Archivo | Responsabilidad |
|---|---|
| `mqtt/client.js` | Conexión única al broker Mosquitto (host/puerto/usuario/contraseña del cliente `backend`, ver `TopicosMQTT.md` §5). Expone `connect()`, `subscribe(topico, handler)`. |
| `mqtt/subscriber.js` | El equivalente de un `controller`, pero para MQTT: recibe `(topico, payloadCrudo)` de `client.js`, separa `id_predio`/`id_sensor` del tópico (`incendios/{id_predio}/{id_sensor}`), arma el DTO y llama a `evaluarLectura.useCase` **importado de `api/application/lectura/useCases/`** |
| `mqtt/dependencies.js` | Arma el árbol de dependencias del caso de uso: repos reales desde `api/infrastructure/features/...` + el `notifier` que le pasa `websocketManager` (ver §4) |
| `mqtt/bootstrap.js` | Conecta `client.js`, se suscribe a `incendios/+/+`, registra `subscriber.js` como handler |

`mqtt/` no tiene `domain/` ni `application/` propios — toda la lógica de
negocio (validar la lectura, correr el motor de detección, decidir la
alerta) vive en `api/domain` y `api/application`. `mqtt/` solo traduce
"llegó un mensaje MQTT" en una llamada a esos casos de uso, igual que
`api/interfaces/features/*Roter/controller.js` traduce "llegó un request
HTTP".

### Flujo

```
mensaje MQTT (topico, payload)
  → mqtt/subscriber.js                                   (separa id_predio/id_sensor, arma DTO)
  → api/application/lectura/useCases/registrarLectura.useCase.js   (Tabla 5)
  → api/application/lectura/useCases/evaluarLectura.useCase.js     (orquesta)
        usa → api/domain/motorDeteccion/*                          (matemática pura)
        usa → api/application/lectura/repositories/lectura.repository.js   --impl--> api/infrastructure (Prisma)
        usa → api/application/alerta/repositories/alerta.repository.js     --impl--> api/infrastructure (Prisma)
        usa → api/application/realtime/ports/realtimeNotifier.port.js      --impl--> websocketManager (ver §3)
```

## 3. `websocketManager/` (WebSockets)

"Manager de WebSockets" son **dos responsabilidades distintas** que no
deben mezclarse en un solo archivo:

1. **Quién se conecta y a qué rooms se une** (gestión de conexión/membresía).
2. **Cómo un caso de uso avisa que pasó algo** (emisión de eventos), sin
   saber que existe Socket.IO.

| Archivo | Responsabilidad |
|---|---|
| `websocketManager/server.js` | Crea `io = new Server(httpServer, { cors: ... })` y lo expone. Recibe el `httpServer` desde `app.js` (ver §4) — no crea uno propio. |
| `websocketManager/auth.js` | `io.use(...)` — valida la sesión (cookie `sid`) antes de aceptar la conexión, reutilizando el mismo mecanismo que ya usa `requireAuth` en HTTP (`ValidateSesionUseCase` + tabla `sesion`, ver `GuiaAutenticacion.md`). El *handshake* de Socket.IO no pasa por `cookie-parser`, así que este archivo lee `socket.handshake.headers.cookie` a mano para sacar `sid` antes de llamar al mismo caso de uso. |
| `websocketManager/rooms.js` | Funciones puras para nombrar rooms: `institucion(id)` → `"institucion:3"`, `usuario(id)`, `sensor(id)`, `predio(id)` — un solo lugar con el formato. |
| `websocketManager/connectionManager.js` | **Esto es el "manager" en el sentido estricto.** `io.on("connection", socket => {...})`: lee el usuario autenticado (que dejó `auth.js`) y lo une a sus rooms. No conoce reglas de negocio de alertas/lecturas, solo conexión y membresía. |
| `websocketManager/notifier.js` | Implementa `realtimeNotifier.port.js` (definido en `api/application/realtime/ports/`) usando `io.to(room).emit(evento, payload)` — acá se traduce cada método de negocio al evento real (`alerta:confirmada`, etc., `EndpointsWebSockets.md` §2) y a qué rooms llega. |
| `websocketManager/bootstrap.js` | Arma todo: `server.js` + `auth.js` + `connectionManager.js`, construye `notifier.js` y lo **devuelve** para que `app.js` se lo pase a `api/` y a `mqtt/`. |

La interfaz (`realtimeNotifier.port.js`) con los métodos de negocio:

```
emitAlertaConfirmada(alerta)
emitAlertaDescartada(alerta)
emitEnvioActualizado(envio)       // notificacion:envio-actualizado
emitReporteCiudadano(reporte)     // notificacion:reporte-ciudadano
emitLecturaNueva(lectura)
```

Vive en `api/application/` (no en `websocketManager/`) porque es
`api/application` y `mqtt` quienes la **llaman**; `websocketManager` solo
la **implementa**. Esto es el mismo patrón que ya usan los repositorios:
la interfaz vive donde se usa, la implementación concreta vive donde está
el detalle externo.

### Quién llama al notifier

- `evaluarLectura.useCase` (en `api/`, invocado desde `mqtt/`) →
  `emitAlertaConfirmada` / `emitAlertaDescartada` / `emitLecturaNueva`.
- Las 3 acciones `recibir`/`atender`/`cerrar` de `envia`, en `api/`
  (`EndpointsWebSockets.md` §1.7) → `emitEnvioActualizado`.
- `crearReporteUsuario.useCase`, en `api/` (`EndpointsWebSockets.md` §1.9)
  → `emitReporteCiudadano`.

Ninguno de estos casos de uso hace `import { Server } from "socket.io"` —
eso rompería la regla de dependencia. Reciben `realtimeNotifier` por
constructor, igual que reciben un repositorio.

## 4. Cómo se integran los tres — `app.js`

`app.js`, en la raíz de `backend/`, es el único lugar que conoce a los
tres y los conecta entre sí:

```js
import http from "node:http";
import { createApiApp } from "./api/server.js";              // Express app (sin levantar el puerto)
import { createWebsocketManager } from "./websocketManager/bootstrap.js";
import { startMqttSubscriber } from "./mqtt/bootstrap.js";

const apiApp = createApiApp();
const httpServer = http.createServer(apiApp);

const { io, notifier } = createWebsocketManager(httpServer);   // crea io, auth, rooms, connectionManager
startMqttSubscriber({ notifier });                              // conecta al broker Mosquitto, construye los casos de uso con notifier inyectado

httpServer.listen(PORT, ...);
```

Puntos clave de esta integración:
- **`notifier` se crea una sola vez**, en `websocketManager`, y se inyecta
  tanto en los casos de uso de `api/` (para las rutas REST que emiten algo,
  como `recibir`/`atender`/`cerrar`) como en los de `mqtt/` (para cuando el
  motor de detección confirma una alerta). Un solo objeto, dos consumidores.
- **`httpServer` es uno solo**, compartido por Express y Socket.IO —
  Socket.IO necesita el `http.Server` crudo, por eso `api/server.js` ya
  no hace `app.listen(...)` directamente: solo construye y devuelve el
  `app` de Express (`createApiApp()`), y quien lo levanta es `app.js`.
- **`mqtt` no depende de `websocketManager` para funcionar**: si por algún
  motivo no hay `notifier` (todavía no se implementó esa parte), el caso de
  uso puede recibir un notifier "nulo" (no-op) y seguir guardando lecturas
  y alertas igual — solo no avisa en vivo. Mismo principio para `api/`.
- **Un solo proceso Node, un solo deploy**: los tres (`api`, `mqtt`,
  `websocketManager`) corren en el mismo proceso, arrancados por el mismo
  `app.js`. No son tres servicios separados en el sentido de "tres
  despliegues" — son tres carpetas con responsabilidades separadas dentro
  del mismo programa. Si el volumen algún día lo justifica, separar `mqtt`
  a su propio proceso es un cambio acotado (ya está aislado en su propia
  carpeta, sin lógica de negocio propia que migrar), pero no hace falta
  diseñar para eso ahora.

## 5. Resumen de carpetas nuevas/renombradas

```
backend/
  app.js                      HECHO — arma api + websocketManager + mqtt
  api/                        HECHO — renombrado desde src/
    application/
      realtime/ports/          HECHO — realtimeNotifier.port.js + no-op
    domain/
      motorDeteccion/          ENTORNO HECHO — firmas + README, matematica pendiente (otra area)
      lectura/                 PENDIENTE (issues/05-lecturas.md)
    application/
      lectura/                 PENDIENTE (issues/05-lecturas.md)
    infrastructure/
      features/lectura/        PENDIENTE (issues/05-lecturas.md)
    interfaces/                 sin cambios de fondo (ya existe)
  mqtt/                        HECHO
    client.js
    subscriber.js              hoy solo valida forma y reenvia por WebSocket
    dependencies.js            punto de extension para el caso de uso real
    bootstrap.js
    mosquitto.conf.example
  websocketManager/            HECHO
    server.js
    auth.js
    rooms.js
    connectionManager.js
    notifier.js
    bootstrap.js
```

## 6. Pendientes

Lo descrito en este documento ya está implementado (rama
`feature/arquitectura-tiempo-real`): el rename `src/` → `api/`,
`websocketManager/`, `mqtt/` y el puerto `realtimeNotifier` + su no-op.
Lo que queda pendiente es contenido de negocio de cada feature, no de
esta arquitectura:

1. `mqtt/subscriber.js` hoy solo valida la forma del mensaje y reenvía
   `lectura:nueva` por WebSocket — no persiste nada todavía. Falta
   implementar `domain/lectura`, `application/lectura` e
   `infrastructure/features/lectura` (ver `issues/05-lecturas.md`) y
   enchufarlos en `mqtt/dependencies.js` en lugar del reenvío directo.
2. `domain/motorDeteccion/` ya tiene el entorno preparado (firmas,
   `index.js`, contrato documentado en su `README.md`), pero la
   matemática (Hampel, CUSUM, Theil-Sen, contraste de vecinos, puntaje,
   clasificación) todavía lanza "pendiente de implementar" a propósito
   — resolverla es trabajo de otra área. `application/alerta` tampoco
   existe todavía (`issues/06-alertas.md`). Hasta que ambas existan,
   `emitAlertaConfirmada`/`emitAlertaDescartada` no los llama nadie.
3. `emitEnvioActualizado` y `emitReporteCiudadano` tampoco los llama nadie
   todavía — dependen de que existan los endpoints de `envia`/`alerta`
   (`issues/06-alertas.md`) y de `reporte_u` (`issues/08-reportes-usuario.md`).
4. No hay room ni evento específico para "operadores centrales": los 4
   eventos que la documentación dirige a central (`alerta:confirmada`,
   `alerta:descartada`, `notificacion:envio-actualizado`,
   `notificacion:reporte-ciudadano`) se emiten por *broadcast* a todos los
   conectados — ajustar esto depende de que exista autorización por rol.
