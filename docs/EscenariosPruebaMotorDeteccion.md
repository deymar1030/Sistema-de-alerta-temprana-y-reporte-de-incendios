# Escenarios de prueba del motor de detección

Cinco escenarios alineados con los casos que el PDF propone para evaluar el motor
(día normal, tarde calurosa, fuego de crecimiento rápido, fuego lento y sensor
dañado; PDF, p. 21).

> **Aclaración:** todos los historiales, lecturas y señales son **sintéticos**,
> inventados para ejercitar el algoritmo. Las lecturas sintéticas **no son valores
> calibrados** y los parámetros del PDF son **referencias provisionales, no
> calibradas**. Las señales de este documento ya fueron **calculadas con las
> funciones reales** de `backend/api/domain/motorDeteccion/` (Fase 4). Los
> **promedios climáticos** son contexto exterior de terceros: **no son
> temperatura interior y no calibran el motor**.

## Convenciones de cálculo (Fase 4)

- **Funciones del motor usadas:** `filtroHampel`, `cusum`, `theilSen`,
  `contrasteVecinos`, `puntajeAlerta` y `clasificarAlerta`, con la configuración
  de `obtenerConfiguracionMotor(tipo)`.
- **Muestreo y marcas de tiempo.** Todas las lecturas están separadas por
  **10 s**; las 5 series se generan como ejecuciones independientes con la misma
  base de tiempo `t0 = 10:00:00`. La lectura `Rᵏ` tiene la marca
  `t0 + (k−1)·10 s`:
  `R1 10:00:00 · R2 10:00:10 · R3 10:00:20 … R15 10:02:20 · R19 10:03:00 · R20 10:03:10`.
- **Regla de generación de las rampas (reproducible).** Salvo los escalones,
  cada serie es una interpolación lineal de `n` lecturas entre `a` y `b`:
  `vᵢ = a + (b − a)·(i − 1)/(n − 1)`, para `i = 1…n`, redondeada a 2 decimales.
  Las secuencias completas y los `n` usados figuran en
  [Lecturas por escenario](#lecturas-por-escenario-reproducibles).
- **Historial base (fixture reducido de 12 lecturas).** Es un *fixture* sintético
  usado como referencia de Hampel (`mediana`/MAD); **es insuficiente para cubrir
  las ventanas de 30 y 60 minutos** del motor y por eso **no se declaran
  duraciones de 30 min**. Valores y MAD resultante:

  | Variable | 12 lecturas | MAD |
  |---|---|---:|
  | Temperatura | `[24.2, 23.8, 24.1, 23.9, 24.0, 24.3, 23.7, 24.0, 24.1, 23.9, 24.2, 23.8]` | 0.15 |
  | Humedad | `[54, 56, 55, 55, 54, 57, 53, 55, 56, 54, 55, 55]` | 1 |
  | Humo | `[9, 14, 12, 10, 16, 11, 13, 8, 15, 12, 10, 14]` | 2 |
  | CO | `[1, 3, 2, 2, 1, 3, 2, 1, 2, 3, 1, 2]` | 1 |

- **Humedad:** se almacena **positiva**; la **inversión se aplica una sola vez al
  preparar la entrada** del motor (`entrada = −almacenado`, "positivo = más
  riesgo"). **No es una decisión pendiente.**
- **Ventana de CUSUM:** últimos 20 `z` (`cusumVentanaLecturas`), con `k = 0.5`.
- **Lectura ANÓMALA (PDF, l. 179-180 y 255):** una lectura es anómala si
  `|z| ≥ umbral_z`, **o** si `S > cusum_h`, **o** si alcanza un valor crítico. Los
  disparadores de Hampel y CUSUM son **alternativos**, no equivalentes.
- **Instantes permitidos por el PDF:** solo se usan **lecturas hasta el instante**
  (sin datos futuros). La alerta **abre** con una lectura anómala o crítica; la
  **Tabla 10 se evalúa por primera vez en la reevaluación, a partir de 2 minutos**
  desde la apertura; **antes de eso no se aplica el descarte por
  `R < umbralDescarte`**. La **confirmación inmediata** por lectura crítica
  respaldada (regla 2) es la excepción: **no espera los 2 minutos**.
- **Separación de capas:** se distingue **lo que devuelven las funciones del
  motor** para un instante dado de **lo que dependería de la futura capa de
  aplicación** (decidir *cuándo* invocar cada función).

## Umbrales críticos de referencia (PDF, Tabla 3)

| Variable | Unidad | Vivienda | Edificio | Mercado |
|---|---|---:|---:|---:|
| Humo | µg/m³ | 500 | 500 | **300** |
| CO | ppm | 200 | 200 | **100** |
| Temperatura | °C | 70 | 70 | **80** |
| Humedad | % | — | — | — |

## Clima exterior (contexto de terceros; no calibra el motor)

- La Paz — estación más cálida **noviembre** ≈ 16.8 °C; más fría **julio** ≈ 14.6 °C.
  Periodo **1940–presente**. Fuente:
  [weatherjourney.com](https://weatherjourney.com/en/weather-la-paz-3911925).
- El Alto — **noviembre** ≈ 14.4 °C; **julio** ≈ 11.7 °C. Fuente:
  [climate-data.org](https://en.climate-data.org/south-america/bolivia/la-paz/el-alto-4879/)
  y [Weather Atlas](https://www.weather-atlas.com/en/bolivia/el-alto-climate).
- Referencia adicional:
  [timeanddate.com](https://www.timeanddate.com/weather/bolivia/la-paz/climate),
  promedios **1992–2021** (estación La Paz/Alto).

## Lecturas por escenario (reproducibles)

Cada serie tiene **20 lecturas** (salvo el Escenario 1, con 12), separadas 10 s,
desde `10:00:00`. Con 20 lecturas la serie dura **3 min 10 s**; el Escenario 1
dura **1 min 50 s**. La **referencia de Hampel** es siempre el historial base de
12 lecturas; la serie viva es la que se lista.

### Escenario 1 — Día normal (VIVIENDA) · 12 lecturas · 10:00:00–10:01:50

```
temperatura: [24.0, 23.9, 24.1, 24.0, 23.8, 24.2, 24.0, 23.9, 24.1, 24.0, 23.8, 24.0]
humedad:     [55, 55, 54, 56, 55, 55, 54, 55, 56, 55, 54, 55]   (se invierte al entrar)
humo:        [12, 12, 13, 11, 12, 12, 13, 12, 11, 12, 12, 13]
co:          [2, 2, 2, 3, 2, 2, 1, 2, 2, 3, 2, 2]
```

### Escenario 2 — Tarde calurosa (EDIFICIO + 2 vecinos) · 20 lecturas · 3 min 10 s

Rampa `lin(24, 36, 20)` de temperatura, **igual en los 3 sensores** (T1 = T2 = T3);
humedad `lin(55, 40, 20)`; humo y CO constantes.

```
T1: [24.0, 24.63, 25.26, 25.89, 26.53, 27.16, 27.79, 28.42, 29.05, 29.68, 30.32, 30.95,
     31.58, 32.21, 32.84, 33.47, 34.11, 34.74, 35.37, 36.0]      (T2 = T3 = T1)
HR: [55.0, 54.21, 53.42, 52.63, 51.84, 51.05, 50.26, 49.47, 48.68, 47.89, 47.11, 46.32,
     45.53, 44.74, 43.95, 43.16, 42.37, 41.58, 40.79, 40.0]       (se invierte al entrar)
humo: 12 x 20
co:   2 x 20
```

### Escenario 3 — Fuego lento (EDIFICIO + 2 vecinos estables) · 20 lecturas · 3 min 10 s

Rampas `lin(12, 450, 20)` (humo), `lin(24, 50, 20)` (T1), `lin(2, 35, 20)` (CO),
`lin(55, 45, 20)` (humedad). Vecinos de temperatura **estables**: T2 = `24.0` (×20),
T3 = `24.1` (×20).

```
humo: [12.0, 35.05, 58.11, 81.16, 104.21, 127.26, 150.32, 173.37, 196.42, 219.47, 242.53,
       265.58, 288.63, 311.68, 334.74, 357.79, 380.84, 403.89, 426.95, 450.0]
T1:   [24.0, 25.37, 26.74, 28.11, 29.47, 30.84, 32.21, 33.58, 34.95, 36.32, 37.68, 39.05,
       40.42, 41.79, 43.16, 44.53, 45.89, 47.26, 48.63, 50.0]      (T2 = 24.0 x20, T3 = 24.1 x20)
CO:   [2.0, 3.74, 5.47, 7.21, 8.95, 10.68, 12.42, 14.16, 15.89, 17.63, 19.37, 21.11,
       22.84, 24.58, 26.32, 28.05, 29.79, 31.53, 33.26, 35.0]
HR:   [55.0, 54.47, 53.95, 53.42, 52.89, 52.37, 51.84, 51.32, 50.79, 50.26, 49.74, 49.21,
       48.68, 48.16, 47.63, 47.11, 46.58, 46.05, 45.53, 45.0]      (se invierte al entrar)
```

### Escenario 4 — Incendio rápido (MERCADO) · 20 lecturas · 3 min 10 s

Escalones: humo salta a 380 en **R6**; T sube a 45 en **R7** y a 72 desde **R8**;
CO sube a 35 desde **R8**. La **humedad es `N/A`**: este escenario no aporta lectura
de humedad, por lo que el puntaje se renormaliza (véanse los resultados).

```
humo: [12, 12, 12, 12, 12, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380, 380]
T:    [24, 24, 24, 24, 24, 24, 45, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72]
CO:   [2, 2, 2, 2, 2, 2, 2, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35]
```

### Escenario 5 — Falla de sensor (VIVIENDA) · 20 lecturas · 3 min 10 s

El pico es **una lectura alta seguida de una lectura normal**: T = 95 en **R7** y
T = 24 en **R8**; no se afirma su duración física. El resto de variables es
constante.

```
T:    [24, 24, 24, 24, 24, 24, 95, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24]
HR:   55 x 20     (se invierte al entrar)
humo: 12 x 20
co:   2 x 20
```

## Tabla 1 — Escenario, tipo de predio, patrón (sintético) y resultado

| # | Escenario | Tipo (predio sim.) | Patrón e historial *(inventados)* | Duración real | Resultado calculado (estado / clasificación) |
|---|---|---|---|---|---|
| 1 | Día normal | VIVIENDA (P-EA-01) | Estable (véase Escenario 1) | **12 lecturas · 1 min 50 s** | **Sin alerta** (ninguna lectura anómala ni crítica) |
| 2 | Ambiental compartido (tarde calurosa) | EDIFICIO (P-LP-01) + **2 vecinos** | Rampa T `24→36` en los 3 sensores; HR `55→40`; humo `12`; CO `2` | **20 lecturas · 3 min 10 s** | **EN_EVALUACION → DESCARTADA / CLIMA** *(condicionado; ver Escenario 2)* |
| 3 | Incendio gradual (fuego lento) | EDIFICIO (P-LP-01) + **2 vecinos estables** | humo `12→450`; T `24→50`; CO `2→35`; HR `55→45`; vecinos T ~24 °C | **20 lecturas · 3 min 10 s** | **EN_EVALUACION → CONFIRMADA / INCENDIO** |
| 4 | Incendio rápido | MERCADO (P-LP-02) | humo `12→380` (R6); T `24→45→72`; CO `2→35` | **20 lecturas · 3 min 10 s** | **CONFIRMADA / INCENDIO** (inmediata en R7) |
| 5 | Falla de sensor | VIVIENDA (P-EA-01) | T1 con lectura alta (95) en R7 seguida de una normal (24) en R8; humo/CO/HR normales; sin 2.ª crítica | **20 lecturas · 3 min 10 s** | **Abierta** — ver Escenario 5; `SIN_EVIDENCIA` solo si los indicadores de `FALLA_SENSOR` se entregan como falsos |

## Tabla 2 — Historial, tiempos, señales (calculadas) y justificación

| # | Historial y tiempos *(sintéticos)* | Hampel · CUSUM · tendencia · contraste *(calculados)* | ¿Cruza crítico? (Mercado / V-E) | Regla / ejemplo PDF |
|---|---|---|---|---|
| 1 | Base Hampel 12 lecturas; serie viva 12 lecturas (1 min 50 s) | Ningún `\|z\|` anómalo (máx `0.899`, T en R5; humedad y CO `0.6745`, humo `0.337`); **CUSUM no dispara**; `b` no nulo hacia R3 (T `0.3`, humedad `3`, humo `3` /min); **contraste no calculable** (sin vecinos) | No / No | p. 21 |
| 2 | Rampa T 3 min 10 s; reevalúa a los 2 min (R15); **vecinos de T: 2 (grupo de 3)** | T anómala (`z=39.75`), **CUSUM dispara** (`S=291.17`), `b=3.79/min`, `zrob=0`; **humedad sin contraste** | No / No | Tabla 14 "tarde calurosa"; Tabla 9; regla 4 |
| 3 | Rampas 3 min 10 s; reevalúa a los 2 min (R14); **T con 2 vecinos estables → grupo de 3** | humo `z=101.07`; T `z=80.00`; **CUSUM dispara** en humo/T/CO/HR; `b>0` clara; **`zrob=119.32` local** en T | **Sí** (humo 311.68>300) / No en V-E (311.68<500) | Tablas 11-13 (el `R=0.76` es el ejemplo del PDF; S3 da `R=0.8343`); regla 3 |
| 4 | Escalón humo en R6; T 45 en R7 y 72 desde R8 | humo `z=124.11`; T `z=94.43` en R7 | **Sí** (humo 380>300). **T 45: anómala, NO crítica en Mercado (80 °C)** | Tabla 14 "valor crítico con respaldo"; regla 2 |
| 5 | Pico T en R7 (una lectura); reevalúa a los 2 min (R19) | apertura T `z=319.26`; en R19 **T=24 (`z=0`) pero CUSUM conserva `S=312.76`** (residuo) | **Sí** (T 95≥80) / Sí (T 95≥70) | Tabla 14 "sensor dañado"; regla 1 (**no definida**) |

## Flujo temporal: apertura y primera reevaluación (`etapa2DatosMin`)

El PDF fija el mínimo de la etapa 2 en **2 minutos** ("Datos mínimos para la etapa 2
y antigüedad máxima de la lectura de un vecino = 2 min", Tabla 4) y describe la
reevaluación "a partir de 2 minutos de datos". Por eso, en estos escenarios la
**Tabla 10 no se aplica antes de los 2 minutos** de abierta la alerta.

| # | Apertura de alerta (lectura anómala/crítica) | Confirmación inmediata (regla 2) | 1.ª reevaluación (Tabla 10, ≥2 min) |
|---|---|---|---|
| 1 | — | — | — |
| 2 | **R3** 10:00:20 (T anómala) | No (sin lectura crítica) | **R15** 10:02:20 |
| 3 | **R2** 10:00:10 (humo/T anómalas) | No (sin lectura crítica) | **R14** 10:02:10 |
| 4 | **R6** 10:00:50 (humo 380 crítico) | **Sí, R7** 10:01:00 | — (confirma antes de reevaluar) |
| 5 | **R7** 10:01:00 (T 95 crítica) | No (crítico sin respaldo) | **R19** 10:03:00 |

## Resultados calculados por escenario (Fase 4)

### Escenario 1 — Día normal (VIVIENDA)

Ningún `|z|` alcanza el umbral 3. Máximos por variable en el escenario:
temperatura `0.899` (R5), **humedad `0.6745` (R3)**, humo `0.337` (R3) y CO
`0.6745` (R4). **CUSUM no dispara** en ninguna variable. El **máximo del escenario**
es `R = 0.0726` en **R3** (10:00:20), con pendientes Theil–Sen T `0.3 °C/min`,
humedad (inv.) `3 %/min` y humo `3 µg/m³/min` (CO `0`); en **R12** (10:01:50)
`R = 0.0116`. Ambos muy por debajo del umbral de descarte (0.45). **No se abre
alerta.** No procede clasificación.

*Theil–Sen usa la ventana elegida para estos escenarios: las lecturas del evento
hasta el instante evaluado (sin datos futuros). El PDF no fija esa ventana.*

### Escenario 2 — Tarde calurosa (EDIFICIO + 2 vecinos) · apertura R3, reevaluación R15

**Apertura R3 (10:00:20).** T `25.26 °C`, `z=5.67` (anómala) ⇒ abre alerta
`EN_EVALUACION`. Humedad `53.42 %`, `z=1.07`; humo y CO normales. `R=0.1933`.

**Primera reevaluación R15 (10:02:20, 15 lecturas).**

| Variable | Valor | Hampel z | CUSUM S | ¿dispara? | Theil–Sen b | zrob |
|---|---|---|---|---|---|---|
| Temperatura | 32.84 °C | 39.751 | 291.174 | sí | 3.79 /min | **0.000** (vecinos 32.84, 32.84) |
| Humedad (inv.) | 43.95 % → −43.95 | 7.453 | 48.916 | sí | 4.74 /min | **no disponible** (sin 2 vecinos) |
| Humo | 12 µg/m³ | 0.000 | 0.000 | no | 0.00 | no disponible |
| CO | 2 ppm | 0.000 | 0.000 | no | 0.00 | no disponible |

- `porVariable`: T `0.5137`, humedad `0.7746`, humo `0`, CO `0`.
- **R = 0.2833**.
- **Resultado condicionado (no se inventa regla).** La regla 4 (CLIMA) exige
  `mayoriaVecinosAfectados && todosZrobBajoUmbral && !humoAnomalo && !coAnomalo`.
  Aquí **solo la temperatura tiene contraste calculable** (`zrob=0.000`); la
  **humedad no tiene contraste disponible** (`contrasteVecinos` devuelve
  `calculable:false` con menos de 2 vecinos, `zrob=null`), igual que humo y CO.
  Por tanto **`todosZrobBajoUmbral` no puede confirmarse** sin definir qué hacer
  con las variables sin contraste (el PDF no lo define), y
  `mayoriaVecinosAfectados` tampoco está definido por el PDF.
  - **CLIMA queda condicionado**: no se afirma ni se descarta. Si en el futuro se
    confirma `todosZrobBajoUmbral`, procedería regla 4 → `DESCARTADA / CLIMA`.
  - Si no puede confirmarse, o si `mayoriaVecinosAfectados` no se adopta: como
    `R = 0.2833 < 0.45`, **regla 5 ⇒ `DESCARTADA / SIN_EVIDENCIA`**.

### Escenario 3 — Fuego lento (EDIFICIO + 2 vecinos estables) · apertura R2, reevaluación R14

**Apertura R2 (10:00:10).** humo `35.05`, `z=7.77`; T `25.37`, `z=6.16`; CO
`3.74`, `z=1.17`; humedad `54.47`, `z=0.36`. Ninguna lectura crítica ⇒ **no** hay
confirmación inmediata; abre `EN_EVALUACION`. `R=0.6280`.

**Primera reevaluación R14 (10:02:10, 14 lecturas).**

| Variable | Valor | Hampel z | CUSUM S | ¿dispara? | Theil–Sen b | zrob |
|---|---|---|---|---|---|---|
| Humo | 311.68 µg/m³ | 101.067 | 700.980 | sí | 138.32 /min | no disponible |
| Temperatura | 41.79 °C | 79.996 | 553.470 | sí | 8.21 /min | **119.319** (vecinos 24.0, 24.1) |
| CO | 24.58 ppm | 15.230 | 100.105 | sí | 10.42 /min | no disponible |
| Humedad (inv.) | 48.16 % → −48.16 | 4.614 | 25.951 | sí | 3.16 /min | no disponible |

- `porVariable`: humo `1.0`, T `0.9463`, CO `0.6607`, humedad `0.6626`.
- **R = 0.8343** ≥ 0.60, con CUSUM disparado y humo anómalo ⇒ **regla 3**:
  **CONFIRMADA / INCENDIO**.

### Escenario 4 — Incendio rápido (MERCADO) · salida directa R6 vs. flujo real

**Salida directa de `clasificarAlerta` en R6 (10:00:50).**

| Variable | Valor | Hampel z | CUSUM S | ¿dispara? |
|---|---|---|---|---|
| Humo | 380 µg/m³ (**crítico**, ≥300) | 124.108 | 123.608 | sí |
| Temperatura | 24 °C | 0.000 | 0.000 | no |
| CO | 2 ppm | 0.000 | 0.000 | no |

- **R = 0.2500** (`humo` 0.5714). La **humedad es `N/A`**: el puntaje se calcula
  **renormalizando los pesos de las variables presentes** (`humo` 0.35 + T 0.25 +
  CO 0.20 = 0.80), con lo que se conservan `R = 0.2500` en R6 y `R = 0.4286` en R7.
  Regla 2 no (sin respaldo ni otra variable anómala); regla 5 ⇒
  **DESCARTADA / SIN_EVIDENCIA**.

**En el flujo real (con `etapa2DatosMin`).** La alerta se abre en R6 con humo
crítico; como R6 está **dentro del gate de 2 min**, **no se aplica la Tabla 10** y
la alerta permanece `EN_EVALUACION` (el descarte de R6 **no ocurre** en el flujo).
La **confirmación inmediata** sí se evalúa en cada lectura: en **R7 (10:01:00)** se
cumple la regla 2 porque (a) la lectura de humo vuelve a ser crítica (380→380) y
(b) la temperatura (variable distinta) es anómala.

| Variable | Valor | Hampel z | CUSUM S | ¿dispara? |
|---|---|---|---|---|
| Humo | 380 µg/m³ (crítico) | 124.108 | 247.216 | sí |
| Temperatura | 45 °C (**anómala**, <80 no crítica) | 94.430 | 93.930 | sí |
| CO | 2 ppm | 0.000 | 0.000 | no |

- **R en R7 = 0.4286.** La confirmación **no** depende de R: la produce la
  **regla 2** (`valorCriticoActual && otraVariableAnomala`) ⇒
  **CONFIRMADA / INCENDIO**.

**Conclusión:** la secuencia `DESCARTADA(R6) → CONFIRMADA(R7)` **no pertenece al
flujo**; el `DESCARTADA` de R6 es solo la salida directa de invocar la función
antes de que el gate permita aplicar la Tabla 10.

### Escenario 5 — Falla de sensor (VIVIENDA) · apertura R7, reevaluación R19 · **PENDIENTE**

**Apertura R7 (10:01:00).** T `95 °C` (crítica, ≥70), `z=319.263`, `S=318.763`.
Sin respaldo crítico ni segunda variable anómala ⇒ **no** hay confirmación
inmediata; abre `EN_EVALUACION`. `R=0.1429` (T `0.5714`, resto 0).

**Primera reevaluación R19 (10:03:00, 19 lecturas).**

| Variable | Valor | Hampel z | CUSUM S | ¿dispara? | Theil–Sen b |
|---|---|---|---|---|---|
| Temperatura | 24 °C | 0.000 | **312.763** | sí | 0.00 |
| Humedad (inv.) | 55 % → −55 | 0.000 | 0.000 | no | 0.00 |
| Humo | 12 µg/m³ | 0.000 | 0.000 | no | 0.00 |
| CO | 2 ppm | 0.000 | 0.000 | no | 0.00 |

- **CUSUM remanente del pico de R7:** la serie de `z` es `[0,…,0, 319.26, 0,…,0]`;
  el pico deja `S` alto y, sin más `z`, decae `k=0.5` por lectura, de modo que en
  R19 aún vale `S=312.763 > cusum_h=5`. Es decir, **`algunSensorCusumDisparado=true`
  aunque el sensor ya volvió a 24**. Por la definición de lectura ANÓMALA (PDF,
  l. 255), la temperatura en R19 **sigue siendo anómala** por el CUSUM remanente
  aunque su `z=0`.
- **`algunSensorCusumDisparado` no decide por sí solo.** La regla 3 exige además
  `R ≥ umbralConfirmacion` **y** humo o CO anómalos. En R19 `R = 0` y humo/CO no
  son anómalos ⇒ regla 3 **no** aplica. Tampoco aplica la regla 2 (no hay lectura
  crítica actual), de modo que el clasificador recae en la **regla 5** (o en la
  regla 1, si estuviera definida).
- **La clasificación definitiva queda ABIERTA.** `SIN_EVIDENCIA` es el resultado del
  clasificador **solo si los indicadores pendientes de `FALLA_SENSOR` se entregan
  como falsos**. La regla 1 exige `unicoSensorAnomalo && saltoFisicoImposible &&
  otrasVariablesSinCambios`, y el PDF **no define**:
  1. el **límite de "salto físicamente imposible"** por variable (el ejemplo usa
     24→95 °C, pero sin umbral numérico), ni
  2. la definición de **"sin cambios en las demás variables"** (¿ninguna anómala?,
     ¿variación por debajo de qué?).
  - Con esos indicadores en **falso** ⇒ regla 5: `DESCARTADA / SIN_EVIDENCIA`.
  - Si se definieran de modo que la regla 1 se cumpliera ⇒ `DESCARTADA / FALLA_SENSOR`.
  - Sin definirlos, **no puede fijarse la clasificación** (ni `SIN_EVIDENCIA` ni
    `FALLA_SENSOR`). Además, como fila de la Tabla 10, `FALLA_SENSOR` se evalúa en
    la reevaluación: con el pico ya extinguido en R19, aunque existieran los
    límites, habría que decidir en qué instante se mide el salto frente al gate de
    2 min.

## Qué depende aún de la futura capa de aplicación

Lo anterior es el resultado de las **funciones del motor** para instantes y
ventanas concretos. Todavía **no** está resuelto en código (ni debe asumirse aquí):

- **Marcar `tiempoEvaluacionVencido`** (`tiempo_max_evaluacion_min`, 10/15 min).
- **Confirmación inmediata en cada lectura** (camino aparte de la reevaluación).
- **Espera de 15 min tras un descarte** y reapertura por lectura crítica.
- **Armado de ventanas/vecinos** reales (aquí se usó el historial base de 12
  lecturas, insuficiente para las ventanas de 30/60 min, y vecinos fijos).
- **Cálculo de los indicadores de `clasificarAlerta`** que hoy se aportan como
  entradas: `mayoriaVecinosAfectados`, `todosZrobBajoUmbral` (afecta el
  Escenario 2), `unicoSensorAnomalo`, `saltoFisicoImposible` y
  `otrasVariablesSinCambios` (afectan el Escenario 5).
