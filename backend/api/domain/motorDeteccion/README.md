# `domain/motorDeteccion` — contrato pendiente de implementar

Esta carpeta es el entorno preparado para el motor de detección de
incendios. **La matemática no está implementada todavía** — cada función
lanza `"pendiente de implementar"` a propósito. Resolverla es trabajo de
otra área (no de esta rama de arquitectura), a partir de
[`bd/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](../../../../bd/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf).

## Regla de la carpeta

Todo lo que viva acá debe ser **puro**: sin `import` de Prisma, Express,
Socket.IO ni el cliente MQTT, sin `await`, sin leer el reloj ni el
entorno. Recibe datos ya cargados (ventanas de lecturas, parámetros del
motor) y devuelve un resultado — nada más. Eso es lo que permite
testearlo con casos fijos, sin DB ni broker, y es lo que hace que
`application/lectura/useCases/evaluarLectura.useCase.js` (quien va a
llamar a estas funciones) pueda orquestar sin preocuparse de cómo se
calcula cada cosa.

## Parámetros del motor (`bd.sql`, tabla `motor_det`)

Cada predio tiene asignado un motor con estos 7 parámetros, que las
funciones de abajo reciben como entrada (no los recalculan ni los leen
de la base):

| Columna | Lo que es |
|---|---|
| `ventana_base_min` | minutos de historial que entran en cada `ventana` |
| `umbral_z` | umbral del z-score de `filtroHampel` |
| `cusum_h` | umbral `h` de `cusum` |
| `umbral_confirmacion` | puntaje R a partir del cual `clasificarAlerta` confirma |
| `umbral_descarte` | puntaje R por debajo del cual `clasificarAlerta` descarta |
| `tiempo_max_evaluacion_min` | tiempo máximo que una alerta puede quedar `EN_EVALUACION` |
| `radio_vecindad_m` | radio para elegir los sensores vecinos de `contrasteVecinos` |

## Funciones

### `filtroHampel(ventana, valorActual)`
PDF, ecuaciones 1-2. Detecta si `valorActual` es un outlier respecto a la
mediana/MAD de `ventana` (array de valores numéricos recientes del mismo
sensor, tamaño según `ventana_base_min`).
Devuelve `{ esAnomalo: boolean, zScore: number }`.

### `cusum(ventana, valorActual, h)`
PDF, ecuación 3. Suma acumulada de desviaciones para detectar un cambio
sostenido de nivel (no solo un pico puntual). `h` es `motor_det.cusum_h`.
Devuelve `{ disparado: boolean, acumulado: number }`.

### `theilSen(ventana)`
PDF, ecuación 4. Pendiente robusta de la tendencia reciente. `ventana` es
un array de `{ valor: number, fecha_hora: Date }`.
Devuelve la pendiente estimada (`number`).

### `contrasteVecinos(valorActual, valoresVecinos)`
PDF, ecuación 5 (`zrob`). Compara `valorActual` contra las lecturas más
recientes de la misma variable en los sensores dentro de
`motor_det.radio_vecindad_m`.
Devuelve `zrob` (`number`).

### `puntajeAlerta(senales)`
PDF, ecuaciones 6-7. Combina las 4 señales anteriores
(`{ zScore, cusum: acumulado, pendiente, zrob }`) en el puntaje R del
episodio.
Devuelve un número entre `0` y `1` (este es el valor que termina en
`alerta.puntaje`).

### `clasificarAlerta(puntaje, motor)`
PDF, Tabla 10. Decide el estado según `puntaje` contra
`motor.umbral_confirmacion`/`motor.umbral_descarte` (el objeto `motor` es
la fila de `motor_det` asignada al predio).
Devuelve `"CONFIRMADA" | "DESCARTADA" | "EN_EVALUACION"`.

## Quién las va a llamar

`application/lectura/useCases/evaluarLectura.useCase.js` (pendiente, ver
`issues/06-alertas.md`): trae la ventana histórica del sensor y los
vecinos vía repositorio, llama estas funciones en orden
(`filtroHampel`/`cusum`/`theilSen`/`contrasteVecinos` → `puntajeAlerta` →
`clasificarAlerta`), y según el resultado abre/reevalúa/confirma/descarta
la alerta y avisa por `realtimeNotifier`. Nada de esa orquestación vive
acá adentro.
