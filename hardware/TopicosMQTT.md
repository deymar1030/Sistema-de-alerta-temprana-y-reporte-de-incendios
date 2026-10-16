# Integración MQTT para el cliente de un predio

Este documento dice **a qué tópico publicar y con qué forma de datos**
para que un predio (real o simulado) se integre con el sistema. No dice
cómo construir la simulación en Python ni ninguna otra lógica interna del
cliente — eso es decisión de quien la implemente.


## Broker

**Mosquitto.** Host, puerto y si se usa TLS quedan pendientes de definir
cuando se levante el broker (ver `docs/TopicosMQTT.md` §7).

## Un cliente por predio

Cada predio se conecta al broker **una sola vez** (una conexión MQTT), sin
importar cuántos sensores físicos tenga. Esa misma conexión publica en un
tópico distinto por cada sensor del predio.

## Tópico

```
incendios/{id_predio}/{id_sensor}
```

- `{id_predio}` es el mismo para todos los sensores de ese predio.
- `{id_sensor}` identifica a cada sensor dentro del predio.
- Ambos valores los asigna el sistema al registrar el predio/sensor en la
  base de datos — no los inventa el cliente.

## Payload

Por cada publicación:

```json
{ "valor": 82.7, "fecha_hora": "2026-10-02T18:10:00Z" }
```

- `valor`: número, en la unidad del sensor (`sensor.unidad_medida`).
- `fecha_hora`: fecha y hora de la medición, en ISO 8601, puesta por el
  propio cliente (no la pone el backend al recibir el mensaje).
- No se manda `id_sensor`, `id_predio` ni `tipo_variable` en el payload:
  los dos primeros ya están en el tópico, y el tercero el backend lo
  resuelve a partir del sensor.

## Frecuencia

Cada sensor publica su lectura **cada 5 a 10 segundos**.

## QoS y retain

- **QoS 0**.
- **retain: false**.

## Autenticación

El cliente se conecta con **su propio usuario y contraseña** (uno por
predio, no compartido entre predios) — eso es obligatorio, el broker
rechaza cualquier conexión sin credenciales válidas.

**Importante (decisión de equipo):** por ahora el broker **no** aplica
control de acceso por tópico (ACL) — solo exige autenticación. Esto
significa que, en la práctica, cualquier cliente autenticado podría
publicar o suscribirse a cualquier tópico, no solo al de su propio
predio. Se acepta esta limitación por ahora para simplificar la puesta en
marcha; cada cliente igual debe comportarse y publicar **solo** en su
propio `incendios/{id_predio}/#`, aunque el broker no lo esté forzando
todavía. Las credenciales se coordinan por fuera de este documento (hoy
se aprovisionan localmente, ver `docs/TopicosMQTT.md` §5).

## Integración con el resto del sistema

No hay ningún otro paso del lado del cliente: una vez que publica
correctamente en su tópico, con su usuario autorizado, el backend ya está
suscrito (`incendios/+/+`) y procesa la lectura automáticamente. El
cliente no necesita saber nada del motor de detección, de `lectura`, de
alertas ni de WebSockets — eso es responsabilidad exclusiva del backend.
