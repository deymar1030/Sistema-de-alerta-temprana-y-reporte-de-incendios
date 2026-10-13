# `domain/motorDeteccion` — motor de detección implementado

Esta carpeta contiene el motor de detección de incendios. **Las seis
funciones del dominio están implementadas** (`filtroHampel`, `cusum`,
`theilSen`, `contrasteVecinos`, `puntajeAlerta` y `clasificarAlerta`), a
partir de
[`docs/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](../../../../docs/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf).
La **configuración de referencia** del motor (parámetros por tipo de predio y
constantes de las fórmulas) está en
[`parametrosMotor.js`](parametrosMotor.js); sus valores son de referencia del
PDF y **no están calibrados** con datos reales.

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

## Configuración de referencia (`parametrosMotor.js`)

Los valores concretos por tipo de predio viven en `parametrosMotor.js`, separados
de las fórmulas. Son **valores de referencia del PDF**, **no calibrados** con
datos reales. El módulo solo expone datos y una búsqueda pura: sin I/O, sin
Prisma, sin entorno.

- `CONFIGURACIONES`: un bloque por tipo (`vivienda`, `edificio`, `mercado`, con
  las diferencias del PDF Tabla 2). Cada bloque trae los parámetros generales
  (`ventanaBaseMin`, `umbralZ`, `cusumH`, `umbralConfirmacion`, `umbralDescarte`,
  `tiempoMaxEvaluacionMin`, `radioVecindadM`) y `variables`.
- `variables`: claves `humo`, `co`, `temperatura`, `humedad`, cada una con
  `umbralCritico`, `peso`, `bmax`, `madMin` y `unidad` (PDF Tablas 3 y 4). El
  `umbralCritico` de la humedad es `null` porque el PDF no le asigna umbral
  crítico. `bmax` y `MADmin` son iguales para los tres tipos y van dentro de la
  variable.
- `CONSTANTES_FORMULA`: constantes compartidas por las fórmulas (PDF Tabla 4):
  `zrobUmbral` (3.5), `cusumVentanaLecturas` (20) y `cusumK` (0.5).
- `META_PARAMETROS`: origen y estado (`referencia, no calibrada`).
- `obtenerConfiguracionMotor(tipoPredio)`: normaliza el texto (minúsculas, sin
  tildes ni espacios), devuelve el bloque del tipo y **lanza un error explícito**
  si el tipo no existe; no hay valor por defecto silencioso.

Los tiempos de aplicación/infraestructura (contexto previo 5 min, etapa 2 a 2
min, antigüedad de vecino 2 min, espera tras descarte 15 min, retención 24 h) **no**
forman parte de esta configuración: pertenecen a la capa de aplicación.

## Funciones

### `filtroHampel(ventana, valorActual, madMin, umbralZ)`
PDF, ecuaciones 1-2. Detecta si `valorActual` es un outlier respecto a la
mediana/MAD de `ventana` (array de valores numéricos recientes del mismo
sensor, tamaño según `ventana_base_min`).

- Entrada: `ventana` (valores `VALIDA` sin alerta del mismo sensor),
  `valorActual`, `madMin` de la variable y `umbralZ` del motor.
- Fórmulas: `mediana` y `MAD = mediana(|xᵢ − x̃|)`; luego
  `z = 0.6745 · (valorActual − x̃) / max(MAD, madMin)`.
- Salida: `{ mediana, mad, z, esAnomala }` con `esAnomala = |z| ≥ umbralZ`.
- Convención de signo: la humedad llega con el signo ya invertido desde la
  preparación de entradas (positivo = más riesgo); esta función no invierte.
- Si `ventana` viene vacía no hay mediana/MAD: devuelve valores nulos y
  `esAnomala = false` (la aplicación no debe evaluar sin historial).

### `cusum(zRecientes, cusumH, cusumK, cusumVentanaLecturas)`
PDF, ecuación 3. Suma acumulada de desviaciones para detectar un cambio
sostenido de nivel (no solo un pico puntual).

- Entrada: `zRecientes` (los `z` de las últimas lecturas del sensor, en orden
  temporal antiguo → nuevo), `cusumH` (`motor_det.cusum_h`), `cusumK` y
  `cusumVentanaLecturas`. Los dos últimos ya no tienen valores incrustados:
  los entrega la configuración (`CONSTANTES_FORMULA`, PDF Tabla 4: `cusumK = 0.5`
  y `cusumVentanaLecturas = 20`).
- Recurrencia: `Sₜ = max(0, Sₜ₋₁ + zₜ − k)`, sobre las últimas
  `cusumVentanaLecturas` lecturas.
- Decisión provisional (documentada): el acumulado se **recalcula desde
  `S₀ = 0`** con los `z` recibidos en cada llamada; no se persiste.
- Salida: `{ acumulado, disparado }` con `disparado = acumulado > cusumH`.
- Convención de signo: la humedad llega con el signo ya invertido desde la
  preparación de entradas (positivo = más riesgo); esta función no invierte.

### `theilSen(lecturas)`
PDF, ecuación 4. Pendiente robusta de la tendencia reciente (estimador de
Theil–Sen).

- Entrada: lista de `{ valor, fecha_hora }` (la `fecha_hora` se acepta como
  `Date` o cadena convertible a fecha).
- Calcula la pendiente de cada par de lecturas con **timestamps distintos**:
  `b = (vⱼ − vᵢ) / (tⱼ − tᵢ)`, expresada en unidades **por minuto**; se omiten
  los pares con tiempo igual.
- Salida: `{ pendiente, calculable }`. `pendiente` es la **mediana** de los
  pares y **no se redondea** internamente; `calculable = false` y
  `pendiente = null` cuando no hay ningún par válido.
- Convención de signo: la humedad llega con el signo ya invertido desde la
  preparación de entradas (positivo = más riesgo); esta función no invierte.

### `contrasteVecinos(valorActual, valoresVecinos, madMin)`
PDF, ecuación 5 (`zrob`). Compara `valorActual` con el grupo formado por el
propio sensor evaluado y sus vecinos.

- Entrada: `valorActual`, `valoresVecinos` (lecturas recientes de la misma
  variable en los sensores vecinos) y `madMin` de la variable. La selección de
  vecinos ya llega hecha (no hay consultas ni cálculo de distancia aquí).
- Grupo de comparación: `[valorActual, ...valoresVecinos]`.
- Fórmula: `zrob = 0.6745 · (valorActual − x̃) / max(MAD, madMin)`, con `x̃` y
  `MAD` calculados sobre el grupo.
- Salida: `{ zrob, calculable }`, sin redondear. `calculable = false` y
  `zrob = null` si el grupo tiene menos de 3 sensores.
- Convención de signo: la humedad llega con el signo ya invertido desde la
  preparación de entradas (positivo = más riesgo); esta función no invierte.

### `puntajeAlerta(senales, parametros)`
PDF, ecuaciones 6-7. Combina las señales de cada sensor en un puntaje, toma el
sensor más anómalo de cada variable y pondera las variables para obtener el
puntaje del episodio `R`.

- Entrada:
  - `senales`: objeto `variable -> [{ z, b, zrob }]` con las señales ya
    calculadas y con la convención de humedad aplicada; `zrob` nulo o ausente
    cuando el contraste no fue calculable. Solo las variables con sensores.
  - `parametros`: objeto `variable -> { peso, bmax }` del motor
    (`PARAMETRO_VARIABLE`); solo las variables configuradas aquí entran al
    análisis.
- Puntaje por sensor (ec. 6):
  `s = 0.4·min(1, z/5) + 0.3·min(1, b/bmax) + 0.3·min(1, zrob/7)`, con cada
  término recortado a `[0, 1]` (los negativos valen 0). Si no hay contraste se
  omite el término `zrob` y los pesos `0.4` y `0.3` se renormalizan entre los
  dos restantes (dividiendo por `0.7`).
- Puntaje por variable: el mayor `s` entre los sensores de esa variable.
- Puntaje del episodio (ec. 7): `R = Σ (pesoᵥ / Σpesos) · sᵥ` sobre las
  variables presentes; las variables ausentes se excluyen y sus pesos se
  redistribuyen de forma proporcional.
- Salida: `{ porSensor, porVariable, R }`, sin redondear.
- **No calculable:** si no hay ninguna variable presente (el objeto de señales
  llega vacío), el puntaje no puede calcularse y se devuelve `R = null` con
  `porSensor` y `porVariable` vacíos. No se convierte en `0` ni en `NaN`, para
  no confundir "sin evidencia" con "no hay nada que puntuar" (la alerta se
  abre por una lectura anómala, así que en la práctica sí hay variables).

### `clasificarAlerta(entrada)`
PDF, Tabla 10. Aplica las reglas **en orden** (gana la primera que se cumple) y
devuelve `{ estado, clasificacion }`. No calcula estadística ni fija umbrales:
recibe `R`, los umbrales del motor y los indicadores ya calculados.

- Entrada (objeto):
  - `R` (puede ser `null`), `umbralConfirmacion`, `umbralDescarte`.
  - `algunSensorCusumDisparado`, `humoAnomalo`, `coAnomalo`.
  - Indicadores de contexto: `unicoSensorAnomalo`, `saltoFisicoImposible`,
    `otrasVariablesSinCambios`, `valorCriticoActual`, `respaldoCritico`,
    `otraVariableAnomala`, `mayoriaVecinosAfectados`, `todosZrobBajoUmbral`,
    `tiempoEvaluacionVencido`.
- Reglas, en orden:
  1. `unicoSensorAnomalo && saltoFisicoImposible && otrasVariablesSinCambios`
     → `DESCARTADA` / `FALLA_SENSOR`.
  2. `valorCriticoActual && (respaldoCritico || otraVariableAnomala)`
     → `CONFIRMADA` / `INCENDIO` (inmediata). `otraVariableAnomala` la aporta
     quien llama y debe corresponder a una variable distinta de la crítica.
  3. `R >= umbralConfirmacion && algunSensorCusumDisparado &&
     (humoAnomalo || coAnomalo)` → `CONFIRMADA` / `INCENDIO`.
  4. `mayoriaVecinosAfectados && todosZrobBajoUmbral && !humoAnomalo &&
     !coAnomalo` → `DESCARTADA` / `CLIMA` (humo y CO normales se derivan de
     "no anómalos").
  5. `tiempoEvaluacionVencido || R < umbralDescarte` → `DESCARTADA` /
     `SIN_EVIDENCIA`.
  6. Ninguna → `EN_EVALUACION` / `clasificacion: null`.
- `R = null` (no calculable, ver `puntajeAlerta`) **no** satisface por sí solo
  `R < umbralDescarte` ni `R >= umbralConfirmacion`: las comparaciones
  numéricas solo se evalúan cuando `R` es un número.
- Salida: `{ estado, clasificacion }` con
  `estado ∈ { EN_EVALUACION, CONFIRMADA, DESCARTADA }` y
  `clasificacion ∈ { INCENDIO, CLIMA, FALLA_SENSOR, SIN_EVIDENCIA, null }`.

## Reglas pendientes (el PDF no las define)

No se codifican ni se dejan como campos nulos; están pendientes de definición
del equipo:

- límite de "salto físicamente imposible" por variable (regla `FALLA_SENSOR`);
- criterio de "mayoría de vecinos";
- umbral de "humo y CO normales";
- definición de "sin cambios en las demás variables".

## Quién las va a llamar

`application/lectura/useCases/evaluarLectura.useCase.js` (pendiente, ver
`issues/06-alertas.md`): trae la ventana histórica del sensor y los
vecinos vía repositorio, llama estas funciones en orden
(`filtroHampel`/`cusum`/`theilSen`/`contrasteVecinos` → `puntajeAlerta` →
`clasificarAlerta`), y según el resultado abre/reevalúa/confirma/descarta
la alerta y avisa por `realtimeNotifier`. Nada de esa orquestación vive
acá adentro.
