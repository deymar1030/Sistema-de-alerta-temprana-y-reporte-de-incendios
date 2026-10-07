/**
 * @openapi
 * components:
 *   schemas:
 *     Predio:
 *       type: object
 *       properties:
 *         id_predio:
 *           type: integer
 *           example: 1
 *         id_zona:
 *           type: integer
 *           example: 1
 *         id_motordet:
 *           type: integer
 *           example: 1
 *         tipo_predio:
 *           type: string
 *           enum: [VIVIENDA, EDIFICIO, MERCADO]
 *           example: "MERCADO"
 *         nombre:
 *           type: string
 *           example: "Mercado Rodríguez"
 *         direccion:
 *           type: string
 *           example: "Calle Comercio 45"
 *         latitud:
 *           type: number
 *           example: -16.5
 *         longitud:
 *           type: number
 *           example: -68.133333
 *         fecha_evaluacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         irp:
 *           type: number
 *           nullable: true
 *           description: Índice de riesgo del predio, calculado automáticamente a partir de los campos ordinales.
 *           example: 0.669
 *         estado_electrico:
 *           type: integer
 *           nullable: true
 *         estado_gas:
 *           type: integer
 *           nullable: true
 *         fuentes_calor:
 *           type: integer
 *           nullable: true
 *         carga_combustible:
 *           type: integer
 *           nullable: true
 *         material_construccion:
 *           type: integer
 *           nullable: true
 *         ocupacion:
 *           type: integer
 *           nullable: true
 *         nivel_proteccion:
 *           type: integer
 *           nullable: true
 *         sensores:
 *           type: array
 *           description: Solo presente en el detalle de un predio.
 *           items:
 *             $ref: '#/components/schemas/Sensor'
 *
 *     CreatePredio:
 *       type: object
 *       required:
 *         - id_zona
 *         - id_motordet
 *         - tipo_predio
 *         - nombre
 *         - direccion
 *         - latitud
 *         - longitud
 *       properties:
 *         id_zona:
 *           type: integer
 *           example: 1
 *         id_motordet:
 *           type: integer
 *           example: 1
 *         tipo_predio:
 *           type: string
 *           enum: [VIVIENDA, EDIFICIO, MERCADO]
 *           example: "MERCADO"
 *         nombre:
 *           type: string
 *           example: "Mercado Rodríguez"
 *         direccion:
 *           type: string
 *           example: "Calle Comercio 45"
 *         latitud:
 *           type: number
 *           example: -16.5
 *         longitud:
 *           type: number
 *           example: -68.133333
 *         fecha_evaluacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado_electrico:
 *           type: integer
 *           nullable: true
 *         estado_gas:
 *           type: integer
 *           nullable: true
 *         fuentes_calor:
 *           type: integer
 *           nullable: true
 *         carga_combustible:
 *           type: integer
 *           nullable: true
 *         material_construccion:
 *           type: integer
 *           nullable: true
 *         ocupacion:
 *           type: integer
 *           nullable: true
 *         nivel_proteccion:
 *           type: integer
 *           nullable: true
 *
 *     UpdatePredio:
 *       type: object
 *       description: >
 *         Todos los campos son opcionales; solo se actualizan los que se
 *         envíen. Si se envía algún campo ordinal (estado_electrico,
 *         estado_gas, fuentes_calor, carga_combustible,
 *         material_construccion, ocupacion, nivel_proteccion), el IRP se
 *         recalcula automáticamente.
 *       properties:
 *         id_zona:
 *           type: integer
 *         id_motordet:
 *           type: integer
 *         tipo_predio:
 *           type: string
 *           enum: [VIVIENDA, EDIFICIO, MERCADO]
 *         nombre:
 *           type: string
 *         direccion:
 *           type: string
 *         latitud:
 *           type: number
 *         longitud:
 *           type: number
 *         fecha_evaluacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado_electrico:
 *           type: integer
 *           nullable: true
 *         estado_gas:
 *           type: integer
 *           nullable: true
 *         fuentes_calor:
 *           type: integer
 *           nullable: true
 *         carga_combustible:
 *           type: integer
 *           nullable: true
 *         material_construccion:
 *           type: integer
 *           nullable: true
 *         ocupacion:
 *           type: integer
 *           nullable: true
 *         nivel_proteccion:
 *           type: integer
 *           nullable: true
 *
 *     PredioListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Predio'
 *
 *     PredioMapa:
 *       type: object
 *       properties:
 *         id_predio:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Mercado Rodríguez"
 *         tipo_predio:
 *           type: string
 *           enum: [VIVIENDA, EDIFICIO, MERCADO]
 *         latitud:
 *           type: number
 *           example: -16.5
 *         longitud:
 *           type: number
 *           example: -68.133333
 *         irp:
 *           type: number
 *           nullable: true
 *           example: 0.669
 *
 *     PredioMapaListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/PredioMapa'
 */
