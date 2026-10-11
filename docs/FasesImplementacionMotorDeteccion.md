# Fases de implementación del motor de detección

## Propósito de este documento

Este documento es una guía paso a paso para una IA o desarrollador que vaya a continuar el trabajo del motor de detección de incendios en este repositorio. Debe leer el contexto y completar las fases en orden, reportando hallazgos y cambios al terminar cada fase.

La especificación funcional de referencia es [`DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf), principalmente las páginas 6–21. Los parámetros del PDF son valores propuestos; no afirmar que el equipo los aprobó si no existe confirmación. El PDF [`DM-OPE-01526092026_IRP_Predio.pdf`](DM-OPE-01526092026_IRP_Predio.pdf) trata del IRP, no de detección. El IRP ya está implementado y no debe mezclarse con el cálculo de evidencia de incendio.

## Meta final

Implementar y documentar un motor que reciba lecturas ya validadas y contexto ya consultado por la aplicación, evalúe anomalías y evidencia entre sensores, y produzca un puntaje y una decisión de estado/clasificación. La matemática vive en funciones puras del dominio. La consulta de datos, persistencia, MQTT y notificaciones pertenecen a otras capas.

## Instrucciones para la IA que continúe

1. Empieza por inspeccionar el repositorio; no supongas que el estado coincide con esta guía.
2. Lee los archivos de referencia de la sección siguiente antes de editar.
3. Respeta la arquitectura existente y usa JavaScript ESM.
4. No inventes umbrales, unidades, fórmulas o reglas ausentes. Identifica incertidumbres y propón decisiones explícitas.
5. No modifiques el esquema Prisma, la integración MQTT, API, notificaciones ni rutas durante las fases del núcleo matemático.
6. No uses el IRP para confirmar o descartar incendios.
7. No conviertas predios de simulación en datos operativos. Los escenarios se representan con datos controlados del entorno de desarrollo.
8. Al reportar, distingue cambios implementados, reglas tomadas del PDF y decisiones pendientes del equipo.

## Lecturas obligatorias

Antes de cambiar código, leer:

- [`../backend/api/domain/motorDeteccion/README.md`](../backend/api/domain/motorDeteccion/README.md)
- todos los archivos actuales de `../backend/api/domain/motorDeteccion/`
- [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
- [`../backend/api/domain/predio/calcularIrp.js`](../backend/api/domain/predio/calcularIrp.js), solo para distinguir IRP
- [`GuiaImplementacionMotorDeteccion.md`](GuiaImplementacionMotorDeteccion.md)
- [`GuiaTiempoReal.md`](GuiaTiempoReal.md), para entender la integración prevista, sin implementarla en la fase matemática
- el PDF de detección indicado arriba

## Estructura actual del dominio

Los siguientes archivos ya existen y contienen stubs o exportaciones que deben revisarse y completar; no crear copias con otros nombres:

```text
backend/api/domain/motorDeteccion/
├── README.md
├── index.js
├── filtroHampel.js
├── cusum.js
├── theilSen.js
├── contrasteVecinos.js
├── puntajeAlerta.js
└── clasificarAlerta.js
```

El caso de uso `evaluarLectura.useCase.js` mencionado en documentos de arquitectura no existe en el código revisado. No asumir que la integración ya está hecha.

## Fase 0 — Auditoría y plan concreto

1. Inspeccionar los archivos actuales del motor y sus imports/exports.
2. Revisar los campos actuales de `motor_det`, `parametro_variable`, `predio`, `sensor`, `lectura` y `alerta` en Prisma.
3. Comparar el contrato actual del README con las fórmulas y clasificación del PDF.
4. Devolver un resumen de discrepancias y un plan de cambios de archivos antes de implementar.

**Resultado esperado:** el equipo entiende qué existe, qué está pendiente y qué limitaciones del esquema solo afectan una integración posterior.

## Fase 1 — Contratos del dominio

Definir entradas y salidas explícitas para las funciones. Todas las funciones deben ser síncronas, deterministas y sin I/O.

1. `filtroHampel`: historial numérico, valor actual, `MADmin` y configuración pertinente; resultado con mediana/MAD/z y señal de anomalía, según contrato final.
2. `cusum`: z-scores ordenados, `k`, límite de ventana (20) y `cusum_h`; resultado con acumulado y bandera.
3. `theilSen`: lecturas `{ valor, fecha_hora }`; resultado de pendiente por minuto.
4. `contrasteVecinos`: valor del sensor, observaciones del grupo y `MADmin`; resultado `zrob` o indicación explícita de no calculable. La selección geográfica de vecinos no pertenece a esta función.
5. `puntajeAlerta`: señales por sensor, configuración por variable y pesos presentes; resultado con puntaje por sensor/variable y puntaje de episodio `R` según el contrato elegido.
6. `clasificarAlerta`: señales agregadas, umbrales y condiciones contextuales; resultado que separe `estado` de `clasificacion`.
7. Actualizar `index.js` y README para reflejar las firmas definitivas.

**Regla central de clasificación:** el PDF distingue el estado (`EN_EVALUACION`, `CONFIRMADA`, `DESCARTADA`) de la clasificación (`INCENDIO`, `CLIMA`, `FALLA_SENSOR`, `SIN_EVIDENCIA`). No mezclar ambos en un solo campo de retorno.

**Resultado esperado:** contrato entendible antes de codificar fórmulas. Si la firma de los stubs no basta, modificarla de manera coherente y actualizar consumidores/docs existentes.

## Fase 2 — Implementación matemática pura

Implementar en este orden:

### 2.1 Hampel

- Obtener mediana y MAD de la ventana de referencia.
- Usar `z = 0.6745 * (valorActual - mediana) / max(MAD, MADmin)`.
- Señal anómala si `abs(z) >= umbral_z`.
- `MADmin` por referencia: humo 1 µg/m³; CO 1 ppm; temperatura 0.1 °C; humedad 0.5 %.
- La aplicación suministra lecturas históricas `VALIDA` y sin alerta, dentro de `ventana_base_min`.

### 2.2 CUSUM

- Recurrencia: `S_t = max(0, S_(t-1) + z_t - k)`.
- Valores de referencia: últimas 20 lecturas normalizadas y `k = 0.5`.
- Activación si `S_t > cusum_h`.
- Para humedad invertir la dirección de riesgo porque el descenso de humedad es evidencia.
- No ocultar la decisión sobre reconstruir el acumulado en una constante no documentada; establecer el contrato con base en el PDF y señalar al equipo que la persistencia/ventana temporal es parte de su semántica.

### 2.3 Theil–Sen

- Calcular pendientes por pares `i < j`: `(x_j - x_i) / (t_j - t_i)`.
- Devolver mediana de las pendientes en unidades por minuto.
- Omitir pares con timestamps iguales, que tienen denominador cero; documentar si no queda ningún par válido.

### 2.4 Contraste con vecinos

- La función recibe el grupo ya seleccionado; no realiza consultas ni calcula distancias.
- Usar el valor actual y mediciones vecinas comparables para mediana y MAD robustos.
- `zrob = 0.6745 * (x_i - medianaVecinos) / max(MADVecinos, MADmin)`.
- Con menos de tres sensores en el grupo, indicar que el contraste no está disponible. El puntaje se encargará de redistribuir las ponderaciones según la especificación.

### 2.5 Puntaje

- Términos del PDF: `s_i = 0.4*min(1,z/5) + 0.3*min(1,b/bmax) + 0.3*min(1,zrob/7)`.
- Recortar señales negativas a cero; humedad invierte el signo de anomalía/tendencia.
- Sin contraste (<3 sensores), redistribuir los pesos restantes proporcionalmente: `0.4/0.7` y `0.3/0.7`.
- Por variable, tomar el mayor puntaje de sus sensores.
- Episodio: suma de `peso_variable * s_variable`; redistribuir pesos proporcionalmente entre variables disponibles.
- Mantener `R` en `[0,1]` y devolver precisión numérica suficiente para que el caso de uso persista según la escala Prisma.

### 2.6 Clasificación

Aplicar las reglas del PDF en orden:

1. Sensor único con salto físicamente imposible y sin cambios en otras variables → `DESCARTADA`, clasificación `FALLA_SENSOR`.
2. Lectura crítica respaldada por segunda lectura crítica o anomalía de otra variable → `CONFIRMADA`, clasificación `INCENDIO` inmediata.
3. `R >= umbral_confirmacion`, algún sensor `S > cusum_h`, y humo o CO anómalos → `CONFIRMADA`, `INCENDIO`.
4. Temperatura/humedad cambian en la mayoría de vecinos, todos `abs(zrob) <= 3.5`, y humo/CO normales → `DESCARTADA`, `CLIMA`.
5. Vence `tiempo_max_evaluacion_min` sin confirmar o `R < umbral_descarte` → `DESCARTADA`, `SIN_EVIDENCIA`.
6. Ninguna regla terminal aplica → `EN_EVALUACION` sin clasificación terminal.

La regla de salto físicamente imposible no especifica límites numéricos por variable en el PDF. No inventarlos: dejar esa condición como dato de configuración pendiente o reportar que hace falta definición antes de completar esa rama.

**Resultado esperado:** funciones puras completadas, contratos documentados y reglas de borde expresas. No añadir integración de base de datos en esta fase.

## Fase 3 — Configuración de referencia

Documentar y usar como datos de referencia (no como valores aprobados) estos parámetros del PDF:

| Tipo | Ventana min | `umbral_z` | `cusum_h` | Confirmación R | Descarte R | Máx. evaluación min | Radio m |
|---|---:|---:|---:|---:|---:|---:|---:|
| Vivienda | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 1000 |
| Edificio | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 500 |
| Mercado | 60 | 3.5 | 6.0 | 0.55 | 0.40 | 15 | 500 |

Pesos (vivienda/edificio): humo 0.30, CO 0.25, temperatura 0.25, humedad 0.20. Mercado: humo 0.35, CO 0.20, temperatura 0.25, humedad 0.20.

Umbrales críticos: vivienda/edificio: humo 500 µg/m³, CO 200 ppm, temperatura 70 °C; mercado: humo 300 µg/m³, CO 100 ppm, temperatura 80 °C; humedad sin umbral crítico.

Constantes adicionales: contexto previo 5 min; etapa de confirmación con 2 min de datos; lectura vecina de hasta 2 min; espera 15 min tras descarte; limpieza de lecturas `VALIDA` sin alerta tras 24 h. La limpieza y temporizadores son responsabilidades de aplicación/infraestructura, no del dominio matemático.

## Fase 4 — Escenarios de evaluación

Organizar escenarios como casos de evaluación, no como un módulo de escenarios de producción. Usar datos controlados de predios/sensores de desarrollo y lecturas simuladas por el equipo responsable.

Casos mínimos del PDF:

1. Día normal → no abrir alerta.
2. Tarde calurosa/condición general → vecinos cambian juntos, clasificar `CLIMA` y descartar.
3. Fuego de crecimiento rápido → señales y humo/CO respaldan; confirmar.
4. Fuego lento → cambios sostenidos acumulan CUSUM/tendencia; confirmar.
5. Sensor dañado → pico aislado sin cambios de otras variables; `FALLA_SENSOR`, sujeto a límite físico acordado.
6. Crítico aislado y crítico respaldado → el primero queda en evaluación, el segundo confirma según reglas.

Casos límite: historial insuficiente, MAD cero, menos de tres vecinos, ausencia de una variable, humedad descendente, timestamp repetido, sin pares válidos en Theil–Sen, y evaluación vencida con datos insuficientes. Cada escenario debe indicar unidades, timestamps, configuración y resultado esperado; no deducir expected outputs que el PDF no proporciona sin marcarlos como propuesta.

El documento propone evaluar precisión, exhaustividad, F1, falsas alarmas y retardo de detección, y comparar ablaciones (solo críticos; críticos + Hampel; completo sin contraste; completo). Es evaluación experimental separada del procesamiento de cada lectura.

## Fase 5 — Integración futura con el esquema y la aplicación

No realizarla durante las fases 0–4 salvo instrucción expresa del usuario. Antes, presentar al equipo estas diferencias:

- El esquema actual guarda `predio.tipo_predio` como texto, no como FK al catálogo que espera el PDF.
- `motor_det` no tiene `id_tipo_predio`; no modela formalmente un motor por tipo.
- `parametro_variable` tiene `umbral_critico`, pero no `peso`.
- Coordenadas están en `predio` en vez de una entidad geográfica separada; se pueden adaptar consultas de distancia a ese modelo.
- Alinear categorías de variables y unidades entre sensor, lectura y configuración.
- Revisar validadores/API para los estados y clasificaciones propuestos.

La integración posterior probablemente necesitará:

```text
backend/api/application/lectura/
├── repositories/lectura.repository.js
└── useCases/
    ├── registrarLectura.useCase.js
    └── evaluarLectura.useCase.js
```

No asumir que esos casos de uso ya existen. El caso de uso cargaría parámetros/historial/vecinos, llamaría al dominio y persistiría lectura/alerta mediante interfaces. No debe incorporar la matemática estadística en el repositorio.

## Fase 6 — Informe de entrega

Al cerrar cada fase, informar:

- archivos creados/modificados;
- fórmulas del PDF implementadas;
- convenciones o supuestos usados;
- limitaciones y reglas que requieren confirmación del equipo;
- estado de las fases siguientes.

No afirmar que el motor completo está integrado si solo se implementaron las funciones puras. La integración con simulación MQTT, base de datos y notificaciones es una fase separada.

## Puntos pendientes que la IA no debe resolver inventando

1. Aprobar los valores de referencia y unidades con el equipo/sensores.
2. Definir umbrales de salto físicamente imposible para `FALLA_SENSOR`.
3. Precisar semántica de reconstrucción/reinicio del CUSUM y comportamiento si falta historial.
4. Determinar clasificación cuando vence el tiempo máximo sin datos suficientes.
5. Acordar precisión/redondeo para persistir puntaje.
6. Aprobar cambios al esquema Prisma para tipo de predio, motor por tipo y pesos por variable.

Hasta resolverlos, la IA puede implementar aquello que el PDF define de forma suficiente y dejar esas reglas como contratos/configuración explícitos pendientes, sin presentarlas como comportamiento aprobado.
