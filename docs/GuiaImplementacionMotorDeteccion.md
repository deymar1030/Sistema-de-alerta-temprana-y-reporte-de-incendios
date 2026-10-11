# Guía de implementación del motor de detección de incendios

**Estado:** guía técnica de implementación basada en el documento de diseño. Los valores y reglas del PDF son la base propuesta y deben validarse con el equipo antes de considerarse definitivos. Este archivo describe el motor de detección de lecturas; no especifica MQTT, simulación de sensores ni rutas con OSMnx.

## 1. Documentos y código de referencia

- Especificación del algoritmo: [`DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf), especialmente pp. 6–21.
- Especificación distinta, solo para el riesgo contextual del predio (IRP): [`DM-OPE-01526092026_IRP_Predio.pdf`](DM-OPE-01526092026_IRP_Predio.pdf).
- Contratos iniciales del motor: [`../backend/api/domain/motorDeteccion/README.md`](../backend/api/domain/motorDeteccion/README.md).
- Esquema actual: [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
- Diseño de ingesta MQTT y tiempo real: [`GuiaTiempoReal.md`](GuiaTiempoReal.md) y [`TopicosMQTT.md`](TopicosMQTT.md).

El IRP y el puntaje de episodio `R` son distintos. El IRP caracteriza el riesgo estructural del predio y ya se calcula en `backend/api/domain/predio/calcularIrp.js`. `R` se calcula a partir de lecturas de sensores y participa en la evaluación de una alerta. El IRP no confirma ni descarta incendios.

## 2. Responsabilidad y límites

El motor analiza lecturas validadas y determina si existe evidencia de incendio, condición ambiental, falla de sensor o falta de evidencia. La matemática se implementa como funciones puras en:

```text
backend/api/domain/motorDeteccion/
```

Las funciones reciben valores, tiempos, historial y configuración como argumentos; devuelven resultados y no realizan I/O. En particular, esta carpeta no debe importar Prisma, Express, MQTT, Socket.IO ni clientes HTTP, y no debe leer el reloj o el entorno.

La capa `application` se responsabiliza de cargar los datos requeridos y aplicar los resultados: validar y registrar lecturas, obtener historial y vecinos, gestionar alertas y actualizar estados. Infrastructure implementa las consultas de repositorio. MQTT solo entrega lecturas al caso de uso.

## 3. Secuencia general del algoritmo

```text
Mensaje de lectura
  → validar rango físico y marca de tiempo
  → encontrar motor y parámetros de la variable del sensor
  → comprobar umbral crítico
  → comparar con historial propio: Hampel + CUSUM
  → marcar VALIDA o ANOMALA y abrir/reutilizar alerta EN_EVALUACION
  → esperar contexto suficiente (propuesta: 2 min)
  → estimar pendiente (Theil–Sen) y contraste con vecinos
  → puntaje por sensor, por variable y del episodio R
  → clasificar estado y tipo de alerta
  → application persiste cambios y, al confirmar, inicia notificaciones
```

El PDF indica que una lectura inválida también se registra como `INVALIDA`, pero no se evalúa. Las lecturas normales/anómalas se vinculan a una alerta cuando corresponda. Al abrir una alerta se asocian lecturas de contexto de los cinco minutos previos; las siguientes se relacionan al insertarse. Una alerta se agrupa por predio, no se crea una por cada lectura anómala.

## 4. Parámetros de referencia

### 4.1 Parámetros generales por tipo de predio

| Tipo | `ventana_base_min` | `umbral_z` | `cusum_h` | `umbral_confirmacion` | `umbral_descarte` | `tiempo_max_evaluacion_min` | `radio_vecindad_m` |
|---|---:|---:|---:|---:|---:|---:|---:|
| Vivienda | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 1000 |
| Edificio | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 500 |
| Mercado | 60 | 3.5 | 6.0 | 0.55 | 0.40 | 15 | 500 |

### 4.2 Umbral crítico y peso de cada variable

| Variable | Unidad | Vivienda | Edificio | Mercado | Peso vivienda/edificio | Peso mercado |
|---|---|---:|---:|---:|---:|---:|
| Humo (PM2.5) | µg/m³ | 500 | 500 | 300 | 0.30 | 0.35 |
| Monóxido de carbono (CO) | ppm | 200 | 200 | 100 | 0.25 | 0.20 |
| Temperatura | °C | 70 | 70 | 80 | 0.25 | 0.25 |
| Humedad relativa | % | Sin umbral crítico | Sin umbral crítico | Sin umbral crítico | 0.20 | 0.20 |

Los pesos de cada motor suman 1. Una variable que no exista en el predio no contribuye; sus pesos se redistribuyen proporcionalmente entre las variables presentes.

### 4.3 Constantes comunes del backend

| Constante | Valor propuesto |
|---|---:|
| Lecturas usadas por CUSUM | 20 |
| Tolerancia CUSUM `k` | 0.5 |
| Contexto previo asociado al abrir alerta | 5 min |
| Antigüedad máxima para lectura vecina | 2 min |
| Datos mínimos para etapa de confirmación | 2 min |
| Espera tras descarte | 15 min |
| Retención de lecturas `VALIDA` sin alerta | 24 h |
| Umbral de contraste local | `|zrob| > 3.5` |

### 4.4 Pendiente máxima y MAD mínimo por variable

| Variable | `bmax` | `MADmin` |
|---|---:|---:|
| Humo | 100 µg/m³/min | 1 µg/m³ |
| CO | 50 ppm/min | 1 ppm |
| Temperatura | 10 °C/min | 0.1 °C |
| Humedad relativa | 10 %/min | 0.5 % |

Estos números son los valores del documento de diseño y deben confirmarse con el equipo y con las unidades reales de los sensores antes de desplegar el motor.

## 5. Validación de lecturas (fuera del cálculo estadístico)

Antes de la evaluación estadística, application debe comprobar:

- `valor` está dentro de `sensor.rango_min` y `sensor.rango_max`;
- `fecha_hora` no está en el futuro y es posterior a la lectura anterior del mismo sensor;
- el tipo de variable y la unidad del sensor corresponden a la configuración del motor.

Lectura que falla validación: registrar `INVALIDA`, sin incluirla en el algoritmo. El PDF requiere que lecturas inválidas se conserven para auditoría del sensor.

## 6. Etapa 1: anomalía respecto del historial propio

### 6.1 Hampel

Seleccionar lecturas históricas del mismo sensor en los últimos `ventana_base_min`, con `estado_lectura = VALIDA` y `id_alerta IS NULL`. Sea `x̃` su mediana y `MAD = mediana(|xᵢ − x̃|)`. Para la lectura actual `xₜ`:

```text
zₜ = 0.6745 × (xₜ − x̃) / max(MAD, MADmin)
```

La señal Hampel se dispara si `|zₜ| ≥ umbral_z`. `MADmin` es específico por variable para evitar división por cero/ruido menor que la resolución útil.

### 6.2 CUSUM

Para las últimas 20 lecturas normalizadas del sensor, usar:

```text
Sₜ = max(0, Sₜ₋₁ + zₜ − k), con k = 0.5
```

CUSUM se dispara cuando `Sₜ > cusum_h`. Detecta elevaciones sostenidas que no necesariamente producen un z alto en una sola lectura. Para humedad se invierte el signo de la variación, ya que una caída de humedad incrementa el riesgo.

### 6.3 Estado de lectura y apertura

Una lectura válida se marca `ANOMALA` si ocurre al menos una condición:

- `|zₜ| ≥ umbral_z`;
- `Sₜ > cusum_h`;
- supera el umbral crítico de su variable.

En otro caso se marca `VALIDA`. Una anomalía puede abrir una alerta `EN_EVALUACION` si el predio no tiene alerta activa y no está en espera tras un descarte. Un valor crítico puede abrir una alerta incluso durante la espera.

## 7. Umbral crítico y respaldo

La comparación con el umbral crítico ocurre antes de los cálculos estadísticos. Un único valor crítico abre una alerta en evaluación, pero no basta por sí solo para confirmar: podría ser una falla del sensor.

El PDF propone confirmación inmediata si el valor crítico tiene respaldo por una de estas condiciones:

- la siguiente lectura del mismo sensor también es crítica;
- otro sensor del predio registra una lectura crítica;
- otra variable del predio presenta lectura anómala.

El valor crítico sin respaldo sigue el proceso normal de evaluación.

## 8. Selección y contraste de sensores vecinos

Un sensor vecino debe cumplir todos estos criterios definidos por el PDF:

1. mide la misma variable;
2. pertenece al mismo tipo de predio;
3. la distancia entre ubicaciones es menor o igual a `radio_vecindad_m`;
4. tiene una lectura no inválida de los últimos 2 minutos;
5. su predio no tiene una alerta activa.

Los sensores del propio predio forman parte del grupo. La distancia se calcula mediante Haversine sobre latitud/longitud. Para valores del grupo (sensor evaluado más vecinos), calcular mediana `x̃vecinos`, `MADvecinos` y:

```text
zrobᵢ = 0.6745 × (xᵢ − x̃vecinos) / max(MADvecinos, MADmin)
```

`|zrob| > 3.5` sugiere una anomalía local. Si la mayoría de vecinos presenta cambios de temperatura/humedad, pero `|zrob| ≤ 3.5` en todos y humo/CO siguen normales, es evidencia de una condición ambiental común (por ejemplo, tarde calurosa).

Si el grupo tiene menos de tres sensores, no calcular contraste; redistribuir proporcionalmente el peso de contraste entre los otros dos indicadores del puntaje por sensor.

## 9. Etapa 2: tendencia, puntaje y confirmación

La reevaluación de una alerta `EN_EVALUACION` ocurre con lecturas nuevas cuando hay al menos 2 minutos de datos. Por sensor se obtienen:

- `zₜ` de Hampel;
- pendiente `b` de Theil–Sen;
- `zrob` de contraste cuando hay grupo suficiente.

### 9.1 Theil–Sen

Para todos los pares temporales `i < j` de la ventana:

```text
b = mediana((xⱼ − xᵢ) / (tⱼ − tᵢ))
```

La pendiente se expresa por minuto. Si dos lecturas tienen la misma marca de tiempo, su par no define pendiente y se excluye. Las lecturas deben estar ordenadas por tiempo; el flujo de validación rechaza timestamps no posteriores a la última lectura aceptada.

### 9.2 Puntaje por sensor

Para temperatura, humo y CO, recortar señales negativas a cero y normalizar según la fórmula del PDF:

```text
sᵢ = 0.4 × min(1, zₜ / 5)
   + 0.3 × min(1, b / bmax)
   + 0.3 × min(1, zrobᵢ / 7)
```

La humedad usa el signo invertido en sus señales: su descenso representa evidencia de riesgo. Si no hay suficientes sensores para el contraste, se omite el término `zrob` y los pesos `0.4` y `0.3` se normalizan a `0.4/0.7` y `0.3/0.7`, respectivamente.

### 9.3 Puntaje del episodio

De cada variable tomar el `sᵢ` mayor entre sus sensores. Combinar las variables presentes con los pesos de `PARAMETRO_VARIABLE`:

```text
R = Σ (peso_variable × s_variable)
```

Si faltan variables, redistribuir proporcionalmente los pesos presentes para que el total aplicado sea uno. `R` queda en el rango `[0,1]` y se guarda como `alerta.puntaje`.

## 10. Clasificación: estado y tipo son campos distintos

El PDF revisa las reglas en el orden siguiente. La clasificación describe el motivo; el estado expresa el ciclo de vida.

| Prioridad | Condición | Estado | Clasificación |
|---:|---|---|---|
| 1 | Un único sensor anómalo, salto físicamente imposible y sin cambios en otras variables | `DESCARTADA` | `FALLA_SENSOR` |
| 2 | Valor crítico respaldado por otro valor crítico o por anomalía en otra variable | `CONFIRMADA` | `INCENDIO` |
| 3 | `R ≥ umbral_confirmacion`, algún sensor tiene `S > cusum_h` y humo o CO es anómalo | `CONFIRMADA` | `INCENDIO` |
| 4 | Temperatura/humedad alteradas en mayoría de vecinos, todos con `|zrob| ≤ 3.5`, humo y CO normales | `DESCARTADA` | `CLIMA` |
| 5 | Se agota `tiempo_max_evaluacion_min` sin condición de incendio, o `R < umbral_descarte` | `DESCARTADA` | `SIN_EVIDENCIA` |
| 6 | Ninguna regla anterior se cumple | `EN_EVALUACION` | Aún sin clasificación terminal |

La exigencia de anomalía de humo o CO impide confirmar un incendio por temperatura sola. Atención y cierre (`ATENDIDA`, `CERRADA`) los realizan usuarios y no son decisiones del motor.

El modelo actual utiliza `alerta.estado` y `alerta.clasificacion`, pero hay que asegurar que DTOs, validadores, repositorios y restricciones acepten estos vocabularios sin mezclar estado con clasificación.

## 11. Funciones existentes y contratos a completar

Los archivos ya creados contienen stubs que lanzan `pendiente de implementar`:

| Archivo | Trabajo esperado |
|---|---|
| `filtroHampel.js` | Mediana, MAD, z robusto y bandera de anomalía. Debe recibir `MADmin` y umbral o devolver z para que el llamador aplique el umbral. |
| `cusum.js` | Acumulado en ventana de 20 z con tolerancia `k` y comparación con `cusum_h`. Definir si la función recibe z ya calculados o lecturas crudas. |
| `theilSen.js` | Mediana de pendientes usando valor y fecha, resultado por minuto. |
| `contrasteVecinos.js` | Mediana/MAD robusta del sensor y vecinos, con `MADmin`; selección de vecinos y distancias pertenece al repositorio/aplicación. |
| `puntajeAlerta.js` | Puntaje por sensor (incluido caso sin contraste) y puntaje por variable/episodio con pesos redistribuidos. Puede requerir separar funciones para contratos claros. |
| `clasificarAlerta.js` | Aplicar reglas ordenadas y devolver resultado que separe estado y clasificación, no solo un estado. |
| `index.js` | Exportar el contrato final público del motor. |

Las firmas actuales del README (`filtroHampel(ventana, valorActual)`, etc.) no incluyen todos los valores que las ecuaciones necesitan. Antes de cerrar la implementación, actualizar firmas y documentación para pasar explícitamente configuración/umbrales y evitar constantes escondidas.

## 12. Diferencias del esquema Prisma que bloquean integración directa

El núcleo numérico se puede implementar independientemente; la integración persistente necesita resolver estos puntos:

| Necesidad del documento del motor | Estado del esquema actual |
|---|---|
| Relación `predio → tipo_predio` | `predio.tipo_predio` actualmente es un `String`, no FK a catálogo. |
| Un motor por tipo de predio | `motor_det` no incluye `id_tipo_predio` ni restricción única por tipo. |
| Peso por variable | `parametro_variable` tiene `umbral_critico`, pero no `peso`. |
| Vecindad geográfica | Predio guarda latitud/longitud directamente; el PDF usa una entidad ubicación separada. Es posible calcular Haversine con el modelo actual, pero las consultas deben adaptarse. |
| Variables con unidad consistente | `sensor.tipo_sensor`, `sensor.unidad_medida` y `lectura.tipo_variable` existen; valores/catálogos/unidades deben armonizarse. |
| Estados/clasificaciones del PDF | Hay campos `alerta.estado` y `alerta.clasificacion`; validar que acepten los valores exactos y las transiciones del documento. |

No modificar el esquema en silencio. Primero proponer y revisar migración Prisma para catálogo/tipo y pesos, o acordar una representación compatible temporal. No duplicar en código datos que deben ser configuración persistente por motor.

## 13. Escenarios de evaluación

Usar predios/sensores del entorno de desarrollo y lecturas simuladas por el equipo responsable de MQTT. No hace falta un módulo de escenarios en producción. Cada escenario documenta tipo de predio, variable/unidad, lecturas ordenadas con tiempo, historial de referencia, sensores vecinos, parámetros y resultado esperado.

Casos del PDF (pp. 17–21):

1. día normal: sin anomalía ni alerta;
2. tarde calurosa: aumento compartido por vecinos, clasificado `CLIMA` y descartado;
3. fuego de crecimiento rápido: señal crítica/anómala, humo o CO respaldan y confirman;
4. fuego lento: CUSUM/tendencia acumulan evidencia hasta confirmar;
5. sensor dañado: salto aislado físicamente imposible sin otras variables, `FALLA_SENSOR`.

Casos límite a documentar:

- historial vacío/corto para Hampel;
- MAD cero o inferior a `MADmin`;
- menos de tres sensores en contraste;
- variable o sensores vecinos ausentes;
- pares de tiempos iguales para Theil–Sen;
- timestamp desordenado (debe fallar validación antes del motor);
- ausencia de parámetro para una variable (registrar/validar pero excluir del análisis, según PDF);
- valores críticos aislados y respaldados;
- ventana de evaluación agotada y tiempo de espera tras descarte.

El PDF propone medir precisión, exhaustividad, F1, falsas alarmas y retardo de detección, y comparar ablaciones: solo umbral crítico; umbral crítico + Hampel; motor completo sin contraste de vecinos; motor completo (p. 21). Es una evaluación experimental sobre casos etiquetados, separada de la lógica de producción.

## 14. Orden recomendado de implementación

1. Confirmar con el equipo que el PDF es la base del algoritmo y validar umbrales/unidades.
2. Alinear categorías y firmas públicas de las funciones del dominio con las ecuaciones.
3. Implementar las funciones matemáticas puras y documentar sus precondiciones/resultados.
4. Preparar casos de evaluación reproducibles con predios de desarrollo y ejemplos del PDF.
5. Presentar cambios necesarios al esquema Prisma para tipo de predio y pesos por variable.
6. Implementar interfaces/repositorios y casos de uso para historial, vecinos, alertas y escritura de lecturas.
7. Conectar el caso de uso a la ingesta MQTT existente y después verificar el flujo end-to-end con los responsables de simulación.

## 15. Decisiones que deben quedar registradas

- Aprobación de parámetros de referencia por tipo y unidades reales de sensor.
- Semántica exacta del CUSUM: ventana de 20 valores, orden temporal y reinicio/reconstrucción del acumulado por sensor.
- Regla concreta para determinar “salto físicamente imposible” en `FALLA_SENSOR`; el PDF describe el criterio pero no entrega límites cuantitativos por variable.
- Semántica del puntaje z usado en la ecuación de `sᵢ` (dirección positiva de riesgo; humedad invertida) y comportamiento si una señal requerida no existe.
- Política de redondeo para persistir `R` y z/puntajes intermedios.
- Representación Prisma de tipos de predio, relación motor-tipo y pesos por variable.
- Qué hacer si se agota la evaluación con datos insuficientes para puntuar.

## 16. No forma parte del motor matemático

- Simular lecturas o publicar MQTT: pertenece al componente de simulación del otro equipo.
- Consultar/guardar lecturas y buscar vecinos: pertenece a application/infrastructure.
- Enviar notificaciones por WebSocket o crear `envia`: integración posterior a confirmar alerta.
- Calcular IRP: ya está en `backend/api/domain/predio/calcularIrp.js` y no altera la detección.
- Calcular rutas de respuesta con OSMnx/Dijkstra: subsistema separado de rutas.
