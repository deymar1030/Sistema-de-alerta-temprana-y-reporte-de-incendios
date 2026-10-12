# Escenarios de prueba del motor de detección

Cinco escenarios alineados con los casos que el PDF propone para evaluar el motor
(día normal, tarde calurosa, fuego de crecimiento rápido, fuego lento y sensor
dañado; PDF, p. 21).

> **Aclaración:** todos los historiales, lecturas y señales son **sintéticos**,
> inventados para ejercitar el algoritmo. Las señales algorítmicas se marcan como
> **“esperadas por validar”** hasta calcularse con las lecturas, tiempos e
> historiales exactos. Las lecturas sintéticas **no son valores calibrados**.
> Los **promedios climáticos** son contexto exterior de terceros: **no son
> temperatura interior y no calibran el motor**.

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

## Tabla 1 — Escenario, tipo de predio, patrón (sintético) y resultado

| # | Escenario | Tipo (predio sim.) | Patrón e historial *(inventados)* | Variables / unidad | Resultado esperado (estado / clasificación) |
|---|---|---|---|---|---|
| 1 | Día normal | VIVIENDA (P-EA-01) | Estable: T `24.0, 23.9, 24.1, 24.0`; humo `12, 12, 13`; CO `2, 2, 2`; HR `55, 55, 54` | T °C · humo µg/m³ · CO ppm · HR % | **Sin alerta** / no aplica |
| 2 | Ambiental compartido (tarde calurosa) | EDIFICIO (P-LP-01) + **2 vecinos** | Rampa **artificial**: T `24→36` °C en 4 min, pareja en los 3 sensores; HR `55→40`; humo `12`; CO `2` | T °C · HR % (+ humo/CO normales) | **EN_EVALUACION → DESCARTADA / CLIMA** |
| 3 | Incendio gradual (fuego lento) | EDIFICIO (P-LP-01) + **2 vecinos estables** | Sube sostenido ~5 min: humo `12→40→120→300→450`; T `24→30→38→50`; CO `2→8→20→35`; HR `55→45`. Vecinos de T ~24 °C | humo µg/m³ · CO ppm · T °C · HR % | **EN_EVALUACION → CONFIRMADA / INCENDIO** |
| 4 | Incendio rápido | MERCADO (P-LP-02) | Salto en segundos: **humo `12→380`**; T `24→45→72`; CO `2→35` | humo µg/m³ · T °C · CO ppm | **CONFIRMADA / INCENDIO** (inmediata) |
| 5 | Falla de sensor | VIVIENDA (P-EA-01) | T1 `24→95→24` en 5 s; humo/CO/HR normales; sin 2.ª crítica | T °C (resto normales) | **Pendiente** (ver nota); esperado DESCARTADA / FALLA_SENSOR, no garantizado |

## Tabla 2 — Historial, tiempos, señales (esperadas por validar) y justificación

| # | Historial y tiempos *(sintéticos)* | Hampel · CUSUM · tendencia · contraste *(esperadas por validar)* | ¿Cruza crítico? (Mercado / V-E) | Regla / ejemplo PDF |
|---|---|---|---|---|
| 1 | Historial estable 30 min; muestreo 5–10 s; ventana ~10 min. Referencias sintéticas: T 24.0/MAD 0.4, humo 12/MAD 3, CO 2/MAD 1, HR 55/MAD 1 | `\|z\|<3`; **CUSUM no dispara**; `b≈0`; **contraste no calculable** (sin vecinos suficientes) | No / No | p. 21 |
| 2 | Rampa artificial 4–5 min; reevalúa a los 2 min; tope 10 min; **vecinos: 2 (grupo de 3)** | T anómala (`\|z\|≥3`); **CUSUM dispara** (`S>5`); `b>0` moderada; `\|zrob\|≤3.5` en todos (máx ~1.35) | No / No | Tabla 14 "tarde calurosa"; Tabla 9; regla 4 |
| 3 | Desarrollo ~5 min; reevalúa a los 2 min; tope 10 min; **T con 2 vecinos estables (~24 °C) → grupo de 3**; humo/CO/HR con <3 sensores | z crece hasta anómalo; **CUSUM dispara** (acumula `>5`); `b>0` clara; **`\|zrob\|>3.5` local** | **Sí** (humo 450>300) / No en V-E (450<500) | Tablas 11-13 (R=0.76); regla 3 |
| 4 | Salto en segundos; tope 10–15 min. **Respaldo (regla `valorCriticoActual && (respaldoCritico \|\| otraVariableAnomala)`):** (1) **humo 380 ≥ 300 crítico** en `t0` → (2) siguiente lectura de humo también crítica (p. ej. 420) ≈5 s después, **o** `otraVariableAnomala` = T 72 anómala (variable distinta de la crítica) → (3) confirmación inmediata | z muy alto; **CUSUM dispara** (`S≫5`); `b` alta; `\|zrob\|` alto | **Sí** (humo 380>300). **T 72: anómala, NO crítica en Mercado (80 °C)**; en V-E sí crítica (70 °C) | Tabla 14 "valor crítico con respaldo"; reglas 2 y 3 |
| 5 | Salto y retorno en 5 s; sin 2.ª crítica; cierre al vencer 10 min | z enorme; **CUSUM dispara**; pendiente aislada grande; `\|zrob\|` alto | **Sí** (T 95≥80) / Sí (T 95≥70) | Tabla 14 "sensor dañado"; regla 1 |

## Escenario 4 — respaldo crítico (Mercado)

En **Mercado** el umbral crítico de humo es **300 µg/m³** y el de temperatura es
**80 °C** (PDF, Tabla 3). Por tanto:

- **humo 380 µg/m³ es crítico**;
- **temperatura 72 °C es anómala** (respecto a su historial) **pero NO crítica**.

Respaldo según la regla acordada
`valorCriticoActual && (respaldoCritico || otraVariableAnomala)`:

1. humo 380 µg/m³ crítico en `t0`;
2. `respaldoCritico`: la siguiente lectura de humo también crítica (p. ej. 420),
   ≈5 s después; **o** `otraVariableAnomala`: temperatura 72 °C anómala
   (una variable distinta de la que produjo la lectura crítica);
3. **CONFIRMADA / INCENDIO** de inmediato.

*(Señales esperadas por validar.)*

## Pendiente — Escenario 5 (falla de sensor)

El PDF **no define** el límite de "salto físicamente imposible" por variable; no
se inventa. Sin ese límite, la regla 1 (`FALLA_SENSOR`) no puede evaluarse con
fiabilidad: la lectura crítica **abre** la alerta (`EN_EVALUACION`), pero sin
respaldo podría cerrar en `SIN_EVIDENCIA` (regla 5) en vez de `FALLA_SENSOR`.
Queda para el equipo el límite numérico por variable y la definición de
"sin cambios en las demás variables".
