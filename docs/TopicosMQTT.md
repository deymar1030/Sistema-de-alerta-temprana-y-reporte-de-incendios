# Arquitectura MQTT (backend)

Este documento es el diseño de cómo el backend se conecta al broker y
recibe las lecturas de los predios. Es la tercera pata del tiempo real
del sistema, junto con los endpoints REST y los WebSockets — ver
[`docs/EndpointsWebSockets.md`](./EndpointsWebSockets.md) — pero va
aparte porque es un protocolo distinto (MQTT, no HTTP ni Socket.IO) y lo
implementa una pieza distinta (`backend/mqtt/`, no el servidor Express).

La plomería (conexión, suscripción, parseo de tópico/payload) ya está
implementada en `backend/mqtt/`. Lo que **no** está implementado todavía
es qué se hace con cada lectura una vez que llega: hoy `mqtt/subscriber.js`
solo valida la forma del mensaje y lo reenvía como `lectura:nueva` por
WebSocket, sin guardarlo ni correr el motor de detección — ver
`issues/05-lecturas.md` e `issues/06-alertas.md`.

Para cómo publica un predio (sin entrar en el backend), ver
[`hardware/TopicosMQTT.md`](../hardware/TopicosMQTT.md).

**Fuente:** [`bd/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](../bd/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf), sección "Recepción y Registro de Lecturas".

---

## 1. Broker

**Mosquitto.**

## 2. Clientes

El modelo es **un cliente MQTT por predio**, no por sensor: el predio tiene
un único dispositivo/gateway que agrupa todos sus sensores físicos y los
publica bajo una sola conexión. Los sensores individuales no se conectan
cada uno al broker.

| Cliente | Rol | Cuántos |
|---|---|---|
| `backend` | Suscriptor (y publisher, reservado para uso futuro — hoy no publica nada) | 1 |
| `predio-{id_predio}` | Solo publisher | 1 por predio |

## 3. Tópicos

| Tópico | Quién publica | Quién se suscribe | Payload |
|---|---|---|---|
| `incendios/{id_predio}/{id_sensor}` | El cliente del predio `{id_predio}`, una vez por cada sensor que tiene | El cliente `backend` | `{ "valor": 82.7, "fecha_hora": "2026-10-02T18:10:00Z" }` |

Un cliente de predio publica en tantos sub-tópicos como sensores propios
tenga (todos bajo su mismo `{id_predio}`), cada 5 a 10 segundos por sensor
(ver PDF). `id_predio` e `id_sensor` van en el tópico, no en el payload.
`tipo_variable` tampoco va en el payload: un sensor mide una sola variable
(columna `sensor.tipo_sensor` en `bd.sql`), el backend la resuelve al
buscar el sensor por `id_sensor`. `fecha_hora` la pone el dispositivo, no
el backend al recibir el mensaje — se valida contra la última lectura
registrada (ver §5).

El backend se suscribe una sola vez, con comodines, porque no conoce de
antemano cuántos predios/sensores existen:

```
incendios/+/+
```

## 4. QoS y retain

- **QoS 0** en todo (publicación y suscripción) — sin reintentos ni
  confirmación de entrega. Decisión explícita: no hace falta más, dado el
  volumen y la frecuencia de las lecturas.
- **retain: no**. El valor "actual" de un sensor vive en la base de datos
  (última fila de `lectura`), no en el broker.

## 5. Seguridad: solo autenticación, sin ACL

**Decisión de equipo (cambio respecto al diseño original):** el broker
**no** aplica control de acceso por tópico (ACL) por ahora — solo exige
usuario/contraseña válidos para conectarse (`allow_anonymous false` +
`password_file` en Mosquitto, ver `mqtt/mosquitto/mosquitto.conf.example`).
No hay reglas que restrinjan a cada `predio-{id_predio}` a publicar solo
en su propio tópico, ni que restrinjan a `backend` a solo suscribirse.

| Usuario | Rol esperado (por convención, no forzado por el broker) |
|---|---|
| `backend` | Suscriptor de `incendios/+/+` (y publisher, reservado para uso futuro) |
| `predio-{id_predio}` | Publisher de `incendios/{id_predio}/#` |

**Implicación de seguridad que se acepta por ahora:** cualquier cliente
autenticado (p. ej. el de un predio, si sus credenciales se filtraran)
podría técnicamente publicar en el tópico de otro predio o suscribirse a
todo `incendios/+/+`. Se documenta como limitación conocida, no como un
descuido — agregar ACL por usuario (ya diseñado, ver historial de este
documento) queda como mejora futura si se decide volver a EMQX o si
Mosquitto se configura con su propio mecanismo de ACL
(`acl_file`/plugins), sin que eso cambie el contrato de tópicos/payload
para los clientes.

**Aprovisionamiento de credenciales:** por ahora se hace **localmente**
(usuario/contraseña agregados a mano al `password_file` de Mosquitto al
dar de alta cada predio) — el proceso formal (quién genera el
usuario/contraseña, cuándo, cómo llega al dispositivo) todavía no está
definido.

## 6. Procesamiento en el backend

Al llegar un mensaje, el suscriptor:

1. Separa `id_predio` e `id_sensor` del tópico.
2. Valida el payload con los criterios de la Tabla 5 del PDF:

   | Verificación | Criterio |
   |---|---|
   | Rango físico | El valor está entre `rango_min` y `rango_max` del sensor |
   | Marca de tiempo | `fecha_hora` no es futura y es posterior a la última lectura registrada de ese sensor |

3. Una lectura válida pasa al motor de detección, que decide si es anómala
   y si pertenece a una alerta; se registra en `lectura`
   (`estado_lectura` `VALIDA`/`ANOMALA`). Una inválida se registra como
   `INVALIDA` y no se evalúa.
4. El resultado es lo que ya se documenta en `EndpointsWebSockets.md` como
   `lectura:nueva` (§2.4) y, si corresponde, `alerta:confirmada` (§2.1).

## 7. Pendientes

1. Proceso formal de aprovisionamiento de credenciales por predio (§5) —
   hoy es manual/local, sin definir con el equipo de hardware.
2. Configuración concreta de Mosquitto (host, puerto, TLS sí/no) — a definir
   cuando se levante el broker.
3. Persistir la lectura y correr el motor de detección (pasos 2 a 4 de
   §6): hoy `mqtt/subscriber.js` solo reenvía el mensaje validado por
   WebSocket, ver `issues/05-lecturas.md` e `issues/06-alertas.md`. El
   entorno del motor (`api/domain/motorDeteccion/`, ver su `README.md`)
   ya está preparado; la matemática en sí la resuelve otra área.
