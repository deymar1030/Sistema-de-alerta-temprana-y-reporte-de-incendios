# Propuesta de escenarios, detección de incendios y rutas de respuesta

**Estado:** propuesta de trabajo para revisión del equipo. No es una especificación aprobada ni implementa servicios.

Este documento reúne el alcance conversado para el aporte de Ciencias de la Computación: preparar escenarios de evaluación y trabajar en el motor de detección y el cálculo de rutas cuando exista una alerta. La simulación de sensores/MQTT corresponde a otro equipo; este alcance consume las lecturas que ese flujo produzca. El PDF `DM-OPE-01526092026_IRP_Predio.pdf` se revisó y especifica el IRP, no el algoritmo de detección de lecturas.

## 1. Objetivo

Ante una alerta asociada a un predio, el sistema deberá:

1. obtener las coordenadas del incidente;
2. identificar instituciones de respuesta cercanas y pertinentes: bomberos, policía y hospitales;
3. pedir al servicio de rutas las rutas viales desde cada institución seleccionada hasta el incidente;
4. devolver la ruta y su distancia para que el sistema pueda mostrarla o comunicarla a las instituciones en una etapa posterior.

Los escenarios La Paz–El Alto servirán como datos de evaluación. Los predios de esos escenarios son puntos ficticios de prueba; las instituciones de la propuesta tienen ubicaciones de referencia y deben verificarse antes de usarse como datos operativos.

## 2. Tecnologías previstas

| Parte | Tecnología | Uso |
|---|---|---|
| API y casos de uso | Node.js, JavaScript ESM, Express | Integrarse con las alertas, consultar PostgreSQL y coordinar la solicitud de rutas. |
| Persistencia existente | PostgreSQL y Prisma | Guardar predios, instituciones, zonas, sensores, lecturas, alertas y relaciones ya modeladas. |
| Servicio de rutas | Python y una API HTTP | Exponer el cálculo de rutas para el backend Node.js. |
| Red vial | OpenStreetMap consultado mediante OSMnx | Obtener la red de calles correspondiente al área entre origen y destino. |
| Ruta | Dijkstra sobre la red vial | Encontrar el camino de menor longitud; el peso inicial propuesto es la longitud de cada tramo (`length`). |
| Pruebas | Herramienta JavaScript del proyecto (por elegir, Vitest o Jest) y pruebas Python del servicio | Verificar cálculos con entradas controladas, sin depender de una simulación MQTT activa. |

OSMnx es una biblioteca Python. Por eso, el cálculo con OSMnx vive en `routing-service/`, no dentro del dominio JavaScript. El servicio obtiene datos viales de OpenStreetMap cuando necesita calcular una ruta. La idea actual no requiere almacenar la red completa de calles en PostgreSQL. Una caché local de redes podría evaluarse después para mejorar disponibilidad y rendimiento, pero no forma parte del alcance acordado hasta ahora.

La ruta mínima por longitud no garantiza el menor tiempo de llegada. El primer alcance calcula distancia; usar tiempos, tráfico o restricciones requiere datos y una decisión adicional.

## 3. Flujo propuesto

```text
Lectura MQTT simulada por el otro equipo
    → validación y evaluación de la lectura
    → alerta confirmada asociada a un predio
    → coordenadas del predio (origen del incidente)
    → selección de instituciones cercanas por categoría/cobertura
    → API Node.js solicita las rutas al routing-service
    → servicio Python obtiene la red vial con OSMnx
    → Dijkstra calcula una ruta institución → incidente
    → respuesta con institución, geometría de ruta y distancia
    → presentación/aviso a las instituciones en una etapa posterior
```

La dirección de la ruta se define desde la institución hacia el incendio, para representar el desplazamiento de respuesta. Como las calles pueden ser de sentido único, el servicio debe usar la red de conducción y las aristas dirigidas de OSMnx.

La alerta actual no contiene latitud/longitud propias en `schema.prisma`. Para alertas originadas por sensores, la ubicación puede resolverse mediante la lectura relacionada → sensor → predio. Si una alerta ciudadana solo tiene las coordenadas de `reporte_u`, el equipo debe acordar cómo se determina el punto de incidente y cómo se relaciona con la alerta antes de usar ese flujo para ruteo.

## 4. Selección de instituciones

La base ya tiene `institucion.latitud` y `institucion.longitud`, `institucion.categoria`, `institucion.estado` y `institucion.disponibilidad_operativa`. También existen `zona_geografica`, `predio` y la relación `cubre_jurisdiccion`.

La propuesta es seleccionar instituciones activas que cubran la zona del predio y tengan coordenadas válidas, y luego priorizar las cercanas dentro de cada categoría. Debe acordarse si se notifica a una institución por categoría o a todas las instituciones elegibles dentro de un radio. La distancia geográfica puede servir para ordenar candidatas; la ruta vial se calcula para las seleccionadas.

### Clasificación de hospitales

En la propuesta de carga inicial, hospitales se almacenan con `categoria = OTRA` y se identifican como hospital en `detalle`, porque las categorías aceptadas actualmente no incluyen `HOSPITAL`. No se debe depender de búsquedas frágiles por texto libre como solución definitiva. Antes de implementar la selección, el equipo debe elegir una alternativa:

- añadir `HOSPITAL` a las categorías aceptadas por API y documentar el cambio de modelo;
- o introducir un campo estructurado de tipo/servicio de institución.

Hasta que esa decisión se implemente, las filas de hospital `OTRA` solo pueden incluirse mediante un criterio acordado y explícito.

## 5. Datos que ya existen y datos que se propone guardar

La fuente de verdad del esquema actual es `backend/prisma/schema.prisma`. `bd/bd.sql` es histórico y no contiene todas las columnas actuales.

### Datos ya modelados

| Dato | Tabla/modelo | Uso en esta propuesta |
|---|---|---|
| Zona y municipio | `zona_geografica` | Contexto territorial del predio y cobertura. El modelo no guarda geometría/polígono de zona. |
| Ubicación y categoría de institución | `institucion` | Coordenadas de origen y clasificación de bomberos, policía u hospital. |
| Cobertura institucional | `cubre_jurisdiccion` | Relación entre zonas e instituciones cubiertas. |
| Ubicación del incendio simulado | `predio.latitud`, `predio.longitud` | Coordenadas destino para las alertas originadas por sensores del predio. |
| Lecturas | `lectura` | Valor, sensor, fecha/hora, variable y vínculo opcional a alerta. |
| Alerta | `alerta` | Estado, puntaje, clasificación y marcas de tiempo. Se vincula a lecturas, reportes, instituciones notificadas, etc. |
| Envío a institución | `envia` | Relaciona alerta e institución y mantiene estado/fechas de envío; no guarda geometría de ruta. |

### Resultado de ruta que el servicio debe devolver

Como mínimo, por institución:

| Campo de respuesta | Descripción |
|---|---|
| `id_alerta` | Alerta para la que se calculó la ruta. |
| `id_institucion` y `categoria` | Institución candidata a la que corresponde la ruta. |
| `origen` | Coordenadas de la institución usadas para el cálculo. |
| `destino` | Coordenadas del incidente usadas para el cálculo. |
| `distancia_m` | Longitud total de la ruta en metros. |
| `ruta` | Secuencia ordenada de coordenadas de la geometría vial (formato GeoJSON o equivalente, por acordar). |
| `proveedor` | OpenStreetMap/OSMnx y atribución de los datos. |
| `estado_calculo` | Resultado: calculada, sin ruta disponible o error recuperable. |

`duracion_s` puede añadirse cuando exista una estimación de tiempo confiable; no se debe inferir como tiempo real a partir de longitud solamente.

### Persistencia de rutas

El esquema actual no tiene una tabla para almacenar resultados ni geometrías de rutas. Para mostrar una ruta inmediatamente, el servicio puede devolverla sin persistirla. Si el sistema necesita conservar qué ruta se comunicó para una alerta, auditarla o recuperarla después, se propone una entidad nueva de resultados de ruta relacionada con alerta e institución, con campos como:

- identificador de ruta;
- `id_alerta` e `id_institucion`;
- coordenadas de origen y destino empleadas (para preservar el cálculo aunque cambien luego las ubicaciones maestras);
- distancia en metros y, opcionalmente, duración estimada;
- geometría de ruta serializada como GeoJSON/JSON;
- proveedor y fecha/hora del cálculo;
- estado del cálculo/error resumido.

Esto exige definir una migración Prisma y decidir si guardar la geometría como `Json` o usar PostGIS. No se ha añadido ninguno de esos campos todavía. Evitar duplicar el resultado en `envia`: esa tabla representa el envío de la alerta, no el cálculo de navegación.

## 6. Estructura de archivos propuesta

Los escenarios no requieren una carpeta o módulo de código propio: se trabajará con predios registrados en PostgreSQL, usando `predio` y `zona_geografica` existentes, y la guía de carga como referencia para preparar los datos de prueba. La selección de qué predios usar es configuración/datos de evaluación, no una nueva entidad del dominio. No se deben crear predios reales ni insertar la propuesta sin validarla con el equipo.

```text
backend/
├── api/
│   ├── domain/
│   │   ├── motorDeteccion/                 # funciones puras ya esbozadas; matemática pendiente
│   │   └── rutas/
│   │       ├── entities/ruta.entity.js     # representación del resultado si aporta reglas de dominio
│   │       └── dtos/                       # forma/validación de entrada y salida
│   ├── application/
│   │   └── rutas/
│   │       ├── ports/routeService.port.js  # contrato del servicio de cálculo
│   │       └── useCases/
│   │           └── calcularRutaAlerta.useCase.js
│   ├── infrastructure/
│   │   └── rutas/
│   │       └── osmnxRouteClient.js         # cliente HTTP hacia Python
│   └── interfaces/
│       └── features/rutaAlertaRoter/       # endpoint/controller solo si la API lo necesita
└── routing-service/
    ├── app.py                              # API HTTP interna
    ├── router.py                           # descarga/obtiene red y calcula rutas con Dijkstra
    └── requirements.txt                    # Python, OSMnx y framework HTTP elegido
```

No se propone `domain/escenarios/` ni `escenariosLaPazElAlto.js` para duplicar en código los registros que ya viven en la base. Los casos de evaluación pueden documentarse en esta guía y apuntar a los IDs/nombres de predios del entorno de desarrollo. Para pruebas automatizadas, se pueden preparar fixtures efímeros, sin convertirlos en datos operativos ni crear un módulo de escenarios de producción.

El endpoint HTTP público para pedir rutas puede no ser necesario si el cálculo se dispara automáticamente al confirmar una alerta. La interfaz de rutas se crea solo si el frontend u otro consumidor necesita pedir/consultar rutas directamente. El cliente de infraestructura sí permite que el caso de uso se comunique con el servicio Python.

## 7. Motor de detección

Ya existe `backend/api/domain/motorDeteccion/` con seis contratos y un `index.js`. Según el README de esa carpeta, la matemática está pendiente. Las funciones planeadas son:

- Hampel para outliers;
- CUSUM para cambios sostenidos;
- Theil–Sen para tendencia;
- contraste con vecinos;
- combinación de señales en un puntaje;
- clasificación de alerta con los umbrales del motor.

El dominio debe recibir datos y parámetros y devolver resultados puros: sin Prisma, Express, MQTT, Socket.IO, red ni reloj del sistema. La integración con la persistencia y el ciclo de alerta corresponde a casos de uso de `application` y sus repositorios.

El documento [`DM-OPE-01526092026_IRP_Predio.pdf`](DM-OPE-01526092026_IRP_Predio.pdf) **no define estas funciones**. Define el Índice de Riesgo del Predio (IRP), un indicador estructural independiente de la detección: el propio documento establece que el IRP no se usa para confirmar ni descartar una alerta. La especificación del motor sí está en [`DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf).

El IRP combina siete factores del predio (`estado_electrico`, `estado_gas`, `fuentes_calor`, `carga_combustible`, `material_construccion`, `ocupacion` y `nivel_proteccion`) en un valor de riesgo. Esa lógica ya está implementada en `backend/api/domain/predio/calcularIrp.js` y se invoca al crear/actualizar predios desde sus casos de uso. Por tanto, el PDF aporta la definición del IRP y ayuda a contextualizar una alerta confirmada, pero no es la especificación matemática pendiente del motor de detección.

El PDF del motor proporciona fórmulas, parámetros de referencia, reglas de clasificación y escenarios de ejemplo suficientes para iniciar el núcleo matemático. Antes de fijar esos valores como definitivos, el equipo debe validarlos y resolver la adaptación al esquema actual. No se deben deducir criterios de detección del PDF del IRP.

### 7.1 Plan de trabajo basado en el PDF de detección

El documento [`DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf) sí describe el algoritmo de detección, a diferencia del PDF dedicado únicamente al IRP. Se usará como **especificación base de trabajo** para implementar el núcleo matemático. Sus parámetros y ejemplos se considerarán valores de referencia hasta que el equipo los valide. Las páginas indicadas a continuación corresponden a ese PDF.

#### A. Separar detección, riesgo del predio y transporte de datos

- El IRP no participa en la detección. Describe el riesgo del predio y puede acompañar/priorizar una alerta confirmada.
- El motor recibe lecturas ya validadas y datos de contexto ya obtenidos por la aplicación; no recibe mensajes MQTT ni consulta Prisma.
- El dominio `backend/api/domain/motorDeteccion/` contendrá cálculos deterministas sin base de datos, red, reloj del sistema ni dependencias de Express.
- El caso de uso de aplicación será responsable de obtener historial, parámetros, sensores vecinos y alertas activas; guardar lecturas y aplicar cambios de estado queda fuera de las funciones matemáticas.

#### B. Implementar las funciones matemáticas

1. **Hampel** (PDF, pp. 10–11): con lecturas válidas y sin alerta del mismo sensor dentro de `ventana_base_min`, calcular mediana `x̃`, MAD `mediana(|xᵢ − x̃|)` y `z = 0.6745 · (x_actual − x̃) / max(MAD, MADmin)`. La anomalía se detecta si `|z| ≥ umbral_z`.
2. **CUSUM** (PDF, pp. 11, 16–18): sobre las últimas 20 lecturas normalizadas, aplicar `Sₜ = max(0, Sₜ₋₁ + zₜ − k)`, con `k = 0.5`; se activa si `Sₜ > cusum_h`. La humedad usa signo invertido porque su descenso es la señal de riesgo.
3. **Theil–Sen** (PDF, p. 14): obtener pendientes `(xⱼ − xᵢ)/(tⱼ − tᵢ)` para pares de lecturas de la ventana y devolver su mediana. Los pares con marcas de tiempo iguales no tienen pendiente definida; la implementación los omitirá y el caso quedará cubierto en la documentación del contrato.
4. **Contraste con vecinos** (PDF, pp. 12–14): usar la mediana/MAD del grupo de sensores comparables y `zrob = 0.6745 · (xᵢ − x̃_vecinos) / max(MAD_vecinos, MADmin)`. Considerar misma variable, mismo tipo de predio, distancia hasta `radio_vecindad_m`, lectura reciente (últimos 2 min) y ausencia de alerta activa para predios vecinos. Los sensores del predio evaluado también forman parte del grupo. Si hay menos de tres sensores, omitir el contraste y redistribuir proporcionalmente los pesos de los otros indicadores.
5. **Puntaje por sensor y episodio** (PDF, pp. 15, 17–18): combinar anomalía, pendiente y contraste con `sᵢ = 0.4·min(1,z/5) + 0.3·min(1,b/bmax) + 0.3·min(1,zrob/7)`. Los valores negativos se tratan como cero; humedad invierte el signo. Cuando no se calcula el contraste, los pesos de los otros dos términos se normalizan para sumar uno. Para cada variable usar el sensor con mayor puntaje; combinar las variables presentes con los pesos del motor y redistribuir pesos si el predio carece de alguna variable.
6. **Clasificación** (PDF, pp. 16–18): aplicar en orden las reglas de fallo de sensor, incendio crítico respaldado, incendio por puntaje/CUSUM/señal de humo o CO, clima y sin evidencia/tiempo agotado. Mantener separados el estado de la alerta y su clasificación. Un incendio exige anomalía de humo o CO; temperatura por sí sola no confirma un incendio.

El MAD mínimo (`MADmin`) y la pendiente máxima (`bmax`) dependen de la variable. El PDF propone: humo `MADmin=1 µg/m³`, `bmax=100 µg/m³/min`; CO `1 ppm`, `50 ppm/min`; temperatura `0.1 °C`, `10 °C/min`; humedad `0.5 %`, `10 %/min`. Estos valores se guardarán como constantes/configuración explícita del motor, no se inferirán de la unidad de forma dinámica.

#### C. Parámetros de referencia del PDF

| Tipo de predio | Ventana base (min) | `umbral_z` | `cusum_h` | Confirmación R | Descarte R | Evaluación máx. (min) | Radio vecinos (m) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Vivienda | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 1000 |
| Edificio | 30 | 3.0 | 5.0 | 0.60 | 0.45 | 10 | 500 |
| Mercado | 60 | 3.5 | 6.0 | 0.55 | 0.40 | 15 | 500 |

Pesos propuestos por variable: vivienda y edificio: humo 0.30, CO 0.25, temperatura 0.25, humedad 0.20; mercado: humo 0.35, CO 0.20, temperatura 0.25, humedad 0.20. Umbrales críticos: vivienda/edificio: humo 500 µg/m³, CO 200 ppm, temperatura 70 °C; mercado: humo 300 µg/m³, CO 100 ppm, temperatura 80 °C. La humedad no tiene umbral crítico. El PDF también propone contexto previo de 5 min, vecinos con datos de hasta 2 min, espera de 15 min tras descarte y retención de lecturas normales sin alerta de 24 h (pp. 6–7).

Estos son valores documentados por el PDF, no confirmación de que el equipo los haya aprobado ni garantía de que sensores reales utilicen exactamente esas unidades o rangos.

#### D. Definir los contratos de entrada/salida

Las funciones recibirán datos ya cargados: lecturas numéricas y fechas, valores vecinos, configuración del motor y parámetros de variable. Sus resultados serán simples objetos/números/valores clasificables, sin modificar entidades ni escribir en la base.

Hay que corregir la ambigüedad actual del README/contrato: el resultado de clasificación necesita incluir por separado:

- `estado`: `EN_EVALUACION`, `CONFIRMADA` o `DESCARTADA` (y los estados posteriores gestionados por la aplicación);
- `clasificacion`: `INCENDIO`, `CLIMA`, `FALLA_SENSOR` o `SIN_EVIDENCIA`;
- `puntaje` y las señales calculadas necesarias para registrar/diagnosticar la decisión.

El caso de uso de aplicación aplicará también las reglas temporales del PDF: abrir alerta en evaluación, asociar hasta 5 minutos de lecturas previas, reevaluar con al menos 2 minutos de datos, confirmar inmediatamente solo con respaldo de un valor crítico, y aplicar espera de 15 minutos tras descarte excepto la regla de valor crítico. Estas reglas son orquestación/estado, no deben ocultarse dentro de las funciones estadísticas.

#### E. Adaptar el esquema actual antes de la integración persistente

El esquema actual (`backend/prisma/schema.prisma`) no coincide completamente con el modelo descrito por el PDF:

- `predio.tipo_predio` es texto y no una relación a un catálogo `tipo_predio`;
- `motor_det` no tiene `id_tipo_predio`, así que no expresa formalmente un motor por tipo;
- `parametro_variable` tiene `umbral_critico`, pero no `peso`;
- los nombres/categorías y campos existentes deben mapearse a `HUMO`, `CO`, `TEMPERATURA` y `HUMEDAD` con unidades consistentes;
- el modelo actual de `alerta` admite `estado`, `puntaje` y `clasificacion`, pero sus validaciones/API deben permitir los valores y la separación definidos por el PDF.

Por ello, el orden propuesto es implementar y documentar primero el núcleo puro conforme al PDF; después, presentar al equipo una migración/modelo de datos compatible y conectar repositorios/casos de uso. No se debe cambiar el esquema silenciosamente ni asumir que el texto del tipo de predio es equivalente a una relación validada.

#### F. Evaluar con escenarios

Preparar casos de evaluación usando predios y sensores de desarrollo existentes, complementados por secuencias de lecturas simuladas por el otro equipo. Como mínimo, cubrir los casos descritos por el PDF: día normal, tarde calurosa/condición ambiental, fuego de crecimiento rápido, fuego lento y sensor dañado. Añadir casos límite de historial insuficiente, MAD cero, tiempos repetidos/desordenados, sin vecinos y variables ausentes.

Cada escenario debe especificar lecturas/unidades de entrada, configuración de motor, clasificación/estado esperado y puntaje o señales esperadas cuando el PDF los proporciona. Los casos sin resultado numérico explícito se documentarán como casos de comportamiento a validar con el equipo.

La evaluación global que propone el documento incluye precisión, exhaustividad, F1, falsas alarmas y retardo de detección, además de ablaciones (solo umbral crítico; umbral + Hampel; motor sin contraste de vecinos) (PDF, p. 21). Requiere escenarios etiquetados y se realizará como evaluación del algoritmo, no dentro de cada llamada del motor.

## 8. Escenarios de evaluación

La guía [`carga-inicial-escenarios-la-paz-el-alto.md`](carga-inicial-escenarios-la-paz-el-alto.md) aporta cuatro predios simulados y varias instituciones de referencia. Es una base para revisar, no una carga oficial. Los escenarios de evaluación deberían describir, por cada caso:

- identificador y objetivo del caso;
- predio/zona y coordenadas ficticias;
- condiciones de riesgo declaradas;
- lecturas de entrada esperadas (normales, advertencia, críticas o anomalías), suministradas por el equipo que simula MQTT;
- clasificación esperada del motor, una vez aprobadas las fórmulas y parámetros;
- instituciones que deberían seleccionarse;
- rutas esperadas o propiedades a verificar (p. ej. ruta conectada y longitud no negativa), con datos viales controlados para pruebas reproducibles.

Los umbrales de referencia y ejemplos de lectura deben tomarse del PDF del motor y contrastarse con el protocolo del equipo que simula MQTT; no se deben presentar como datos aprobados hasta validación. El IRP puede evaluarse aparte con los siete factores del PDF correspondiente; no debe usarse como resultado esperado de detección. Las ubicaciones públicas y datos de OpenStreetMap deben conservar atribución `© OpenStreetMap contributors` y respetar su licencia ODbL.

## 9. Límites y fallos que debe manejar el diseño

- institución sin coordenadas o sin cobertura relevante;
- categoría de institución no identificable de forma estructurada, especialmente hospitales;
- origen/destino fuera de la red vial descargada o punto alejado de una calle;
- ausencia de ruta entre origen y destino;
- timeout o indisponibilidad de OpenStreetMap/servicio de rutas;
- varias instituciones empatadas o sin candidatas de una categoría;
- geometría demasiado extensa para enviar en una notificación; en ese caso puede compartirse un enlace o consultarse la ruta bajo demanda;
- indisponibilidad operativa: `NULL` no debe interpretarse automáticamente como disponible sin una regla acordada.

Un error al calcular una ruta no debería borrar ni cancelar la alerta; debe registrarse como ruta no disponible y permitir que el flujo normal de alertas continúe.

## 10. Decisiones por confirmar con el equipo

1. ¿Se calcula para una institución más cercana por categoría o para varias dentro de un radio/cobertura?
2. ¿La selección respeta únicamente `cubre_jurisdiccion`, una distancia máxima, disponibilidad operativa o una combinación?
3. ¿Se aprueba `HOSPITAL` como categoría estructurada en vez de inferirlo desde `OTRA`/`detalle`?
4. ¿La primera versión devuelve rutas en vivo sin guardarlas o requiere una tabla de historial de rutas?
5. Si se persisten, ¿geometría JSON/GeoJSON o extensión PostGIS?
6. ¿El peso de Dijkstra será longitud de vía (alcance inicial) o se dispone de datos para estimar tiempo?
7. ¿Qué framework HTTP Python y formato de respuesta se usarán?
8. ¿El equipo valida los parámetros y reglas del PDF `DM-OPE-01727092026_Motor_Deteccion_Predio.pdf` como valores iniciales de implementación?
9. ¿Qué cambios al esquema Prisma se autorizan para representar tipos de predio por motor y pesos por variable?
10. ¿Cómo se manejarán alertas de reportes ciudadanos cuyas coordenadas no corresponden a un predio?
11. ¿Qué componente del otro equipo entrega las lecturas simuladas y qué contrato de datos garantiza?

## 11. Fuentes del repositorio

- [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma): modelos y columnas actuales.
- [`backend/api/domain/motorDeteccion/README.md`](../backend/api/domain/motorDeteccion/README.md): contratos y parámetros planeados del motor.
- [`backend/api/domain/predio/calcularIrp.js`](../backend/api/domain/predio/calcularIrp.js): cálculo IRP que ya existe.
- [`docs/DM-OPE-01526092026_IRP_Predio.pdf`](DM-OPE-01526092026_IRP_Predio.pdf): definición y fórmula del IRP; no especifica detección de lecturas.
- [`docs/DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf): fórmulas, parámetros y flujo propuesto del motor de detección.
- [`docs/GuiaTiempoReal.md`](GuiaTiempoReal.md): arquitectura prevista de MQTT, lecturas y notificaciones en tiempo real.
- [`docs/TopicosMQTT.md`](TopicosMQTT.md): contrato actual de tópicos y payloads de lecturas.
- [`docs/carga-inicial-escenarios-la-paz-el-alto.md`](carga-inicial-escenarios-la-paz-el-alto.md): predios ficticios e instituciones de referencia.
