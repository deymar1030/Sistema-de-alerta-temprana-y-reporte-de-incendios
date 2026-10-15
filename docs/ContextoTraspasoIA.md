# Contexto para continuar el trabajo con otra IA

## Instrucción inicial

Lee este documento y los documentos enlazados antes de proponer cambios. Primero ubícate en el repositorio y explícame el plan. No empieces a implementar nada nuevo hasta que yo te indique qué hacer.

## Proyecto

Este repositorio es un sistema de alerta temprana y reporte de incendios. Sus partes principales son:

- Backend Node.js con JavaScript ESM, Express, Prisma y PostgreSQL: `backend/`.
- Ingesta MQTT y WebSockets en carpetas separadas dentro de `backend/`.
- Modelo de base de datos en `backend/prisma/schema.prisma`.
- Documentación de protocolo, tiempo real y escenarios en `docs/`.

El frontend, la base de datos y el hardware no están documentados/desarrollados con la misma profundidad que el backend.

## Mi aporte y alcance

Soy estudiante de la mención de Ciencias de la Computación. Mi aporte está relacionado con:

1. Preparar escenarios de evaluación usando predios de prueba ya registrados en la base. **No soy responsable de simular sensores ni publicar lecturas MQTT**; eso lo hace otro equipo/mención.
2. El motor que analiza las lecturas y decide si la evidencia corresponde a incendio, clima, falla de sensor o falta de evidencia. **En términos sencillos:** MQTT entrega las lecturas al sistema y el sistema las evalúa para crear, confirmar o descartar alertas.
3. Trabajar en el cálculo de rutas de respuesta con Dijkstra: ante una alerta, considerar instituciones cercanas de bomberos, policía y hospitales, obtener la red vial de OpenStreetMap mediante OSMnx y buscar la ruta de menor distancia. Esta parte es una idea de trabajo posterior y no debe mezclarse con el motor de detección.

## Documentos clave

- [`FasesImplementacionMotorDeteccion.md`](FasesImplementacionMotorDeteccion.md): guía paso a paso para una IA/desarrollador que implemente el motor.
- [`GuiaImplementacionMotorDeteccion.md`](GuiaImplementacionMotorDeteccion.md): explicación técnica de las fórmulas, parámetros, flujos, casos y brechas de modelo.
- [`EscenariosPruebaMotorDeteccion.md`](EscenariosPruebaMotorDeteccion.md): escenarios sintéticos y valores esperados usados para verificar el motor.
- [`DM-OPE-01727092026_Motor_Deteccion_Predio.pdf`](DM-OPE-01727092026_Motor_Deteccion_Predio.pdf): fuente principal del algoritmo de detección, especialmente pp. 6–21.
- [`DM-OPE-01526092026_IRP_Predio.pdf`](DM-OPE-01526092026_IRP_Predio.pdf): documento sobre IRP, **no** es el algoritmo de detección.
- [`GuiaTiempoReal.md`](GuiaTiempoReal.md): notificaciones en tiempo real (Socket.IO) y flujo de la ingesta.
- [`TopicosMQTT.md`](TopicosMQTT.md): formato de tópicos y mensajes MQTT.
- [`PropuestaMotorDeteccionYRutas.md`](PropuestaMotorDeteccionYRutas.md): propuesta general (motor y rutas).
- [`carga-inicial-escenarios-la-paz-el-alto.md`](carga-inicial-escenarios-la-paz-el-alto.md): propuesta no oficial de predios ficticios e instituciones de referencia.
- `backend/api/domain/motorDeteccion/README.md`: contratos del motor.
- `backend/prisma/schema.prisma`: esquema actual, que debe compararse con el PDF antes de integración.

## Estado actual del trabajo

### Fases completadas

- **Núcleo matemático del motor (implementado):** las seis funciones puras viven en `backend/api/domain/motorDeteccion/` (`filtroHampel.js`, `cusum.js`, `theilSen.js`, `contrasteVecinos.js`, `puntajeAlerta.js`, `clasificarAlerta.js`) más `index.js` y `README.md`. Ya no son stubs.
- **Configuración provisional tomada del PDF (implementado):** en `backend/api/domain/motorDeteccion/parametrosMotor.js` (`META_PARAMETROS`, `CONSTANTES_FORMULA` y `obtenerConfiguracionMotor(tipoPredio)`). Los valores son referencias propuestas hasta validación del equipo.
- **Escenarios sintéticos (implementado):** `docs/EscenariosPruebaMotorDeteccion.md` con escenarios y valores esperados. Reproducen el núcleo matemático del motor.
- **Comienzo de la integración (Fase 5, en curso):** ya existen los casos de uso y las piezas de infraestructura que conectan el motor con MQTT.

### Estado actual del flujo MQTT

- La ingesta escucha el tópico `incendios/+/+` y arma la lectura desde el tópico y el payload (`backend/mqtt/bootstrap.js`, `backend/mqtt/subscriber.js`, `backend/mqtt/client.js`).
- El cableado real está en `backend/mqtt/dependencies.js`: encadena `registrarLectura` → (si corresponde) `evaluarLectura`.
- **`registrarLectura`** (`backend/api/application/lectura/useCases/registrarLectura.useCase.js`) valida la lectura (ids, valor, fecha; pertenencia al predio; estado del sensor; rango; fecha no futura; posterioridad a la última lectura):
  - **INVALIDA:** se persiste y se emite.
  - **DESCARTADA:** si el sensor no está `ACTIVO` o su `id_predio` no coincide con el del tópico, se descarta (no se persiste ni se emite) y se registra el motivo en el log.
  - **VALIDA:** pasa a `evaluarLectura`.
- **`evaluarLectura`** (`backend/api/application/lectura/useCases/evaluarLectura.useCase.js`) persiste el resultado y las asociaciones (lectura ↔ alerta) **dentro de una transacción** y **emite las notificaciones después del commit**.
- Las transacciones se abstraen con `backend/api/application/shared/ports/transactionManager.port.js` y `backend/api/infrastructure/prismaConfig/prismaTransactionManager.js`.
- `backend/app.js` arranca la ingesta MQTT pasándole el notificador de tiempo real.

### Decisiones ya acordadas

- La configuración del motor se toma de `parametrosMotor.js` (no de la base de datos).
- La humedad se invierte **solo al preparar la entrada** del motor.
- CUSUM con los **últimos 20 valores z recalculados desde cero** (cada lectura se normaliza con su propia ventana).
- Theil–Sen con las lecturas de **los dos minutos previos a la lectura actual, incluida la actual**.
- Existe un **gate de dos minutos** desde la apertura de la alerta y una **confirmación inmediata** que no espera ese gate.
- Los **límites del rango son inclusivos** (`rango_min <= valor <= rango_max`) y la validación de "fecha no futura" usa el **reloj del servidor**.
- La lectura se persiste **una sola vez** y las notificaciones se emiten **después del commit**.
- La pertenencia al predio y el estado del sensor se validan **dentro de `registrarLectura`**.

## Estado de la revisión

El cableado MQTT fue **revisado estáticamente** y respeta las decisiones anteriores; **no se detectaron errores de lógica concretos**. La **verificación en runtime sigue pendiente** porque faltan dependencias generadas/instaladas (por ejemplo `@prisma/client` y `mqtt`) y acceso a una base de datos.

## Pendientes reales

- **Auditoría:** integrar la traza `MOTOR_NO_EVALUADO` (hoy solo se registra en el log del servidor; no existe capa de acceso a `auditoria`).
- **Instante de la alerta:** resolver la conversión de `alerta.fecha` + `alerta.hora` a UTC (para medir los 2 minutos y el tiempo máximo de evaluación).
- **Concurrencia:** decidir cómo evitar alertas duplicadas cuando llegan lecturas simultáneas.
- **`vincularLecturasPrevias`:** confirmar si debe incluir también lecturas `INVALIDA`.
- **Reglas del PDF sin criterios definidos:** `FALLA_SENSOR` y `CLIMA` siguen deshabilitadas por falta de criterios en el PDF.

## Límite actual

No cambiar el esquema (`backend/prisma/schema.prisma`) ni inventar valores que el PDF no define.

## Discrepancias importantes del esquema actual

El PDF modela un motor por tipo de predio y un peso por variable. El Prisma actual aún no representa todo eso:

- `predio.tipo_predio` es texto, no una FK a catálogo.
- `motor_det` no tiene una relación estructurada a tipo de predio.
- `parametro_variable` tiene umbral crítico, pero no peso.
- Los campos de alertas existen, pero hay que revisar validadores/API y asegurar separación de estado y clasificación.

No cambiar el esquema ni crear migraciones sin explicar primero la brecha y pedirme trabajar en esa fase.

## Reglas de trabajo para la otra IA

- Usa JavaScript ESM y sigue la arquitectura existente.
- Mantén la matemática en `backend/api/domain/motorDeteccion/` como funciones puras: sin Prisma, Express, MQTT, Socket.IO, red ni reloj del sistema.
- Application debe cargar historial, configuración, vecinos y alertas; Infrastructure realiza consultas persistentes.
- No inventes fórmulas, unidades, umbrales ni reglas ausentes del PDF.
- Los valores del PDF son referencias propuestas hasta validación del equipo.
- El criterio cuantitativo para "salto físicamente imposible" de un sensor no está definido en el PDF; no inventarlo.
- Maneja la implementación por fases y reporta archivos, decisiones y pendientes al cerrar cada fase.
- No mezcles simulación MQTT, IRP ni rutas con la matemática del motor.
- No uses predios ficticios como registros operativos sin aprobación.
- Conserva `docs/ContextoTraspasoIA.md` actualizado con el estado real, marcando claramente qué está acordado, implementado y pendiente.

## Qué espero como siguiente paso

Antes de avanzar, inspecciona el código y los documentos enlazados y resume el estado real. A partir de ahí, la continuación natural de la Fase 5 es cerrar los pendientes listados (empezando por la auditoría y el instante `fecha` + `hora`), y más adelante habilitar una verificación en runtime cuando haya dependencias y base de datos disponibles.

## Texto para iniciar el chat con la otra IA

> Estoy trabajando en el motor de detección del proyecto descrito en `docs/ContextoTraspasoIA.md`. Lee primero ese archivo y las guías que enlaza. Mi responsabilidad no incluye simular sensores/MQTT. El núcleo matemático del motor ya está implementado y la integración MQTT (Fase 5) está en curso: `registrarLectura` valida y descarta/persiste lecturas, y `evaluarLectura` evalúa y persiste las alertas. El cableado fue revisado estáticamente y no se detectaron errores de lógica, pero falta verificación en runtime. Antes de proponer cambios, inspecciona el estado real del repositorio y dime qué pendiente conviene abordar.
