# MQTT, detección y tiempo real

Flujo implementado: **simulador por predio → Mosquitto → suscriptor del backend → transacción PostgreSQL y motor → Socket.IO**. Se mantiene el cliente MQTT del backend para validar mensajes, persistirlos y emitir resultados después del commit.

Se conservan los sensores originales: temperatura, humedad, CO₂ y gas %LEL. CO₂ no equivale a CO, ni %LEL a humo. Según la política conservadora acordada, CO₂/%LEL generan anomalías y alertas en evaluación, pero **no confirman incendios automáticamente** hasta disponer de criterios explícitos validados. R no es una probabilidad de incendio.

## Arranque local

Requisitos: Node.js 24, PostgreSQL configurado en `.env`, Mosquitto 2 o Docker Compose, Python 3 y Paho 2.

Desde `backend`:

```powershell
npm install
npm run mqtt:provisionar
npm run mqtt:verificar
```

El aprovisionamiento genera contraseñas y ACL, conserva las contraseñas existentes y no modifica la BD. La verificación consulta pertenencia, tipo, unidad, rango, estado y parámetros de los nueve sensores.

`seed-simuladores.sql` inserta una zona, un motor, cuatro parámetros, tres predios y nueve sensores. **Ya se ejecutó en este entorno con autorización del usuario**, sin cambiar el esquema. No se ejecuta al arrancar y aborta si sus IDs están ocupados. En otra BD, revisar y autorizar la carga antes de ejecutarla.

Terminal 1, iniciar el broker local:

```powershell
npm run mqtt:local
```

Busca `MOSQUITTO_BIN`, luego `backend/.runtime/mosquitto-bin/mosquitto.exe` si existe y finalmente `mosquitto` en PATH. Escucha en `127.0.0.1:1883`. En este entorno se probó el binario nativo; el daemon de Docker no estaba iniciado.

Alternativa con Docker iniciado: `npm run mqtt:up`. Elegir solo una alternativa.

Terminal 2, iniciar el backend:

```powershell
npm run dev:mqtt
```

Carga `mqtt/runtime/backend.env`; `.env` conserva PostgreSQL y HTTP. Variables exportadas en la terminal tienen prioridad. Esperar `[mqtt] suscrito a "incendios/+/+"`.

Terminal 3: iniciar [los simuladores](../../docs/mqtt%20example/SENSORES/README.md). Primero deben estar activos broker y backend: una sesión que nunca se suscribió no recupera publicaciones anteriores.

Ctrl+C detiene procesos locales; `npm run mqtt:down` detiene Docker conservando su volumen.

## Identidades, tópicos y secretos

| Identidad | Permiso |
| --- | --- |
| `backend` | Solo leer `incendios/+/+` |
| `predio-8` | Publicar sensores 31, 32, 33 y 34 de predio 8 |
| `predio-12` | Publicar sensores 51 y 52 de predio 12 |
| `predio-15` | Publicar sensores 70, 71 y 72 de predio 15 |

Tópico: `incendios/{id_predio}/{id_sensor}`, por ejemplo `incendios/8/31`.

```json
{ "valor": 24.125, "fecha_hora": "2026-10-12T14:30:00.000Z" }
```

Solo se aceptan esas dos propiedades. Tipo, unidad y rango se obtienen de la BD. IDs positivos sin ceros iniciales, valores numéricos finitos representables en la BD, fecha ISO con zona horaria y payload máximo de 2048 bytes. Se guardan cuatro decimales y milisegundos.

QoS 1, retain desactivado, frecuencia de 5–10 segundos por sensor. El broker rechaza clientes anónimos, contraseñas incorrectas y publicaciones fuera de la ACL exacta de sensores. Los publishers no pueden leer. El client ID efectivo se vincula al usuario: usar una conexión por predio y una instancia suscriptora por identidad backend.

Archivos ignorados por Git en `mqtt/runtime/`:

| Archivo | Uso |
| --- | --- |
| `passwd`, `acl` | Hashes PBKDF2 y permisos del broker |
| `backend.env` | Credencial del backend |
| `publishers.json` | Credenciales de los simuladores |
| `credentials.private.json` | Material privado para regenerar la configuración |

No versionar secretos. Entregar a un gateway real solo su propia credencial. Después de modificar el manifiesto, verificarlo contra la BD, aprovisionar y reiniciar el broker. Este proceso no actualiza registros en la BD.

## Persistencia y recuperación

Se bloquea la fila del predio dentro de una transacción para serializar ingesta, evaluación, vencimiento y cierre operativo sin nuevas tablas o índices.

- Mensaje mal formado, sensor desconocido, inactivo o ajeno: descartado con diagnóstico.
- Fuera de rango, fecha futura o anterior/igual a la última aceptada: guardado como `INVALIDA`, fuera del motor.
- Reenvío exacto de sensor + fecha + valor: sin duplicar filas ni eventos. Igual fecha con distinto valor: inválido.
- Lectura aceptada: `VALIDA` o `ANOMALA`, asociada al episodio activo cuando corresponde.
- PUBACK se entrega al terminar el procesamiento. Si falla la persistencia, se interrumpe la conexión y el broker puede volver a entregar el mensaje.
- Confirmación, envíos a instituciones activas de la jurisdicción y notificaciones a sus jefes activos se guardan en una misma transacción.

Las confirmadas/atendidas permanecen abiertas hasta el cierre operativo de todos sus envíos. Nuevas lecturas normales no las cierran. Un monitor cada 15 segundos descarta evaluaciones vencidas incluso tras reiniciar o perder los sensores.

La sesión MQTT persistente recupera mensajes si ya existía la suscripción y no se superó la cola del broker (10000 mensajes por cliente). No es almacenamiento ilimitado. Socket.IO emite después del commit, pero no tiene outbox ni reproducción durable: al reconectar, consultar estado e historial por REST y volver a suscribirse.

## WebSockets

Socket.IO usa la cookie del login HTTP y el origen permitido en `CORS_ORIGIN`. No entregar credenciales MQTT al frontend.

```javascript
const socket = io("http://localhost:3000", { withCredentials: true });
socket.on("connect", () => {
  socket.emit("predio:suscribir", { id_predio: "8" }, console.log);
});
socket.on("lectura:nueva", console.log);
socket.on("alerta:abierta", console.log);
socket.on("alerta:actualizada", console.log);
```

También existen `sensor:suscribir`, `sensor:desuscribir`, `predio:desuscribir`, con `id_sensor` o `id_predio`. Ack: `{ ok: true, room }` o `{ ok: false, error }`. Se valida sesión, existencia del recurso y límite de 50 suscripciones por conexión. Se mantiene el alcance de lectura autenticado de REST. Se revalida la sesión periódicamente y al suscribir; vencimiento, revocación o cambio de rol/institución desconectan.

| Evento | Destino y contenido |
| --- | --- |
| `lectura:nueva` | Suscriptores del sensor/predio, sin entrega doble. DTO de lectura más `id_predio` |
| `alerta:abierta`, `alerta:actualizada` | Clientes autenticados. Estado, puntaje, predio, señales, `datos_suficientes`, `confirmacion_disponible` durante evaluación |
| `alerta:confirmada` | Clientes autenticados. Incluye lecturas e instituciones notificadas |
| `alerta:descartada` | Clientes autenticados. Estado y clasificación |
| `notificacion:envio-actualizado` | Institución destinataria |
| `notificacion:nueva` | Usuario destinatario |

Las transiciones operativas también emiten `alerta:actualizada`, sin necesariamente incluir diagnósticos del motor. IDs BigInt se serializan como strings.

## Configuración de detección

Ver [motor](../api/domain/motorDeteccion/README.md) y [JSON de ejemplo](motor.config.example.json). `MOTOR_CONFIG_PATH` acepta ruta absoluta o relativa al proceso. Reiniciar para aplicar cambios.

Umbrales críticos proceden de `parametro_variable`: en la carga de simulación, temperatura 70 °C; humedad, CO₂ y %LEL sin umbral crítico. El JSON permite pesos, escalas y ventanas adicionales sin cambiar el esquema. CO₂/%LEL usan escalas de simulación pendientes de calibración física. La regla de salto imposible requiere configurar `maxSaltoPorMinuto`; por defecto está desactivada.

Los originales no producen `INCENDIO` automáticamente con esta política. Activar nuevas `variablesEvidencia` requiere validar las reglas y parámetros. Cambiar parámetros persistidos sigue requiriendo autorización del responsable de la BD.

## TLS

El listener sin TLS solo se expone en loopback. Para acceso remoto usar `mqtts://`. El backend exige TLS en `NODE_ENV=production`.

Preparar `runtime/certs/server.crt` y `server.key` para el DNS del broker, legibles por Mosquitto. Incluir la cadena necesaria en el certificado.

```powershell
$env:MQTT_BROKER_URL = 'mqtts://broker.ejemplo:8883'
npm run mqtt:provisionar
docker compose -f mqtt/docker-compose.yml -f mqtt/docker-compose.tls.yml up -d
```

Con CA privada, configurar `MQTT_CA_FILE` para el backend y `--ca ruta/ca.crt` en Python. Se verifica certificado/hostname. El perfil TLS publica también en loopback por defecto; definir `MQTT_BIND_ADDRESS` explícitamente para la interfaz remota y habilitar su acceso de red.

El perfil TLS se validó con Compose; la integración completa se probó con Mosquitto nativo local.

## Pruebas

`npm test` ejecuta pruebas unitarias y WebSockets.

La integración requiere una BD **desechable** llamada `mqtt_detection_test`, en servidor local separado y puerto explícito distinto de 5432. Rechaza la URL de la BD normal, vacía datos de prueba y crea el esquema desde `bd/bd.sql` únicamente en esa BD.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://usuario:password@127.0.0.1:55439/mqtt_detection_test'
$env:MOSQUITTO_BIN = 'C:\ruta\mosquitto.exe'
$env:PYTHON_BIN = 'C:\ruta\python.exe'
npm run test:integration
```

Python necesita `paho-mqtt==2.1.0`. Sin `MOSQUITTO_BIN`, la prueba de broker se omite. Se cubren matemática, datos ausentes, parsing, sesiones/salas, deduplicación, concurrencia, rollback, vencimiento, cierre operativo, autenticación/ACL reales, reconexión y los clientes Python originales. Las pruebas de confirmación usan humo exclusivamente en una BD de prueba.

Referencias: [Mosquitto](https://mosquitto.org/man/mosquitto-conf-5.html), [MQTT.js](https://github.com/mqttjs/MQTT.js), [Paho](https://eclipse.dev/paho/clients/python/docs/), [Socket.IO](https://socket.io/docs/v4/rooms/).
