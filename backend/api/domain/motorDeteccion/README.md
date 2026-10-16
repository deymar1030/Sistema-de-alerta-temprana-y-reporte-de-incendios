# Motor de detección

Dominio puro: recibe datos, parámetros, configuración y reloj; no importa Prisma, MQTT, Socket.IO ni variables de entorno.

El enfoque permite detectar anomalías y gestionar episodios. La confirmación física de incendio depende de sensores y criterios validados. Se conservan temperatura, humedad, CO₂ y %LEL originales. No se confunden con humo/CO ni confirman incendios automáticamente bajo la política conservadora acordada.

## Entrada y parámetros

`evaluarPredio({ sensores, vecinos, motor, config, ahora, alerta })` devuelve estado, clasificación, puntaje, señales, suficiencia de datos y disponibilidad de confirmación. `resolverConfiguracion` combina parámetros persistidos con ajustes JSON.

| Parámetro de BD | Uso |
| --- | --- |
| `ventana_base_min` | Ventana de referencia |
| `umbral_z`, `cusum_h` | Umbrales Hampel/CUSUM |
| `umbral_confirmacion`, `umbral_descarte` | Umbrales de R |
| `tiempo_max_evaluacion_min` | Plazo del episodio |
| `radio_vecindad_m` | Selección espacial |
| `parametro_variable.tipo_variable` | Variables habilitadas |
| `parametro_variable.umbral_critico` | Límite crítico opcional |

Complementos por defecto: seis lecturas mínimas de referencia, frescura 120 segundos, tendencia y evaluación de puntaje a los dos minutos, contexto previo cinco minutos y espera de 15 minutos tras descarte. La carga de simulación usa referencia 30 minutos, plazo 10 minutos y radio 500 metros.

`MOTOR_CONFIG_PATH` carga ajustes al arrancar: pesos, `bmax`, `madMin`, `maxSaltoPorMinuto`, ventanas y evidencia. `motores` admite excepciones por ID. Ver [ejemplo](../../../mqtt/motor.config.example.json). Variables habilitadas y límites críticos siguen procediendo de la BD.

## Cálculo

1. Excluir inválidas/futuras; una lectura antigua deja señales desconocidas, no ceros.
2. Referencia: lecturas anteriores `VALIDA`, no asociadas a alertas, dentro de la ventana. Exigir el mínimo configurado. Invertir signo de humedad para evaluar disminuciones.
3. Hampel: mediana/MAD, factor 0.6745 y piso `madMin` para series constantes.
4. CUSUM: últimos 20 z robustos, ordenados, acumulación desde cero y k = 0.5. Reconstruido desde el historial tras reiniciar.
5. Theil–Sen: mediana de pendientes entre pares con tiempo diferente, en unidades/minuto. Ventana de dos minutos; se muestrea uniformemente si supera 120 lecturas.
6. Vecinos: misma variable, mínimo tres sensores incluido el actual. Predios del mismo tipo dentro del radio Haversine y sin alerta activa externa. Sin suficientes sensores, contraste desconocido.
7. Puntaje por sensor: 0.4 × z/5 + 0.3 × pendiente/bmax + 0.3 × zrob/7, limitando cada componente a [0,1]. Sin contraste se redistribuye su peso entre z y pendiente. Por variable se toma el máximo de sus sensores.
8. R pondera variables instaladas y habilitadas. Si una variable instalada no tiene señal calculable, R es `null`. Se usa al cumplirse dos minutos del episodio.

`bmax` normaliza la pendiente: no es umbral de incendio. Las escalas de CO₂/%LEL son valores de simulación, no límites de exposición ni criterios físicos validados.

Al asociar cinco minutos previos a la alerta, esas lecturas salen de la referencia. Para simular con R calculable conviene acumular más de cinco minutos de historial antes del evento; los clientes usan siete minutos.

## Decisión

En orden:

1. `FALLA_SENSOR`: sensor anómalo único, salto físicamente imposible configurado y otras variables conocidas normales. Sin máximo físico definido, la regla no se activa.
2. `INCENDIO`: evidencia habilitada más valor crítico respaldado por repetición reciente u otra variable anómala; o R suficiente con CUSUM. Temperatura crítica repetida por sí sola no confirma.
3. `CLIMA`: mayoría de al menos tres sensores de temperatura/humedad afectados, contraste bajo y gases conocidos normales; tras el período inicial.
4. `SIN_EVIDENCIA`: R calculable bajo el umbral de descarte o plazo vencido.
5. En otro caso, `EN_EVALUACION`.

La evidencia predeterminada admite HUMO/CO. CO₂/%LEL originales sí abren episodios y generan diagnósticos, pero no satisfacen evidencia de incendio. Habilitarlos exige `variablesEvidencia` y `permitirGasesSimulados: true`, además de validación externa de la política. La opción no valida un criterio físico.

`SIN_EVIDENCIA` no demuestra ausencia de riesgo. `confirmacion_disponible: false` indica que no hay variables admitidas para confirmar. R es un índice de las señales, no una probabilidad.

## Orquestación y pruebas

[EvaluarLecturaUseCase](../../application/lectura/useCases/evaluarLectura.useCase.js) valida, evalúa y prepara eventos. El [repositorio Prisma](../../infrastructure/features/lectura/repositories/deteccion.repository.impl.js) serializa por predio y persiste lectura, episodio y distribución institucional de forma atómica.

Una confirmada/atendida no se descarta por nuevas lecturas normales. El cierre de todos sus envíos cierra el episodio y permite uno posterior. El monitor recupera evaluaciones de la BD tras reiniciar y descarta vencidas sin inventar confirmaciones con lecturas antiguas.

Sin cambios de esquema, índices, migraciones ni depuración automática de lecturas.

Desde `backend`: `npm test`. Para pruebas reales de broker, persistencia, concurrencia y rollback, ver [guía de integración](../../../mqtt/README.md).
