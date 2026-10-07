/**
 * @openapi
 * components:
 *   schemas:
 *     Sensor:
 *       type: object
 *       properties:
 *         id_sensor:
 *           type: integer
 *           example: 1
 *         id_predio:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Sensor Humo Patio"
 *         tipo_sensor:
 *           type: string
 *           enum: [TEMPERATURA, HUMO, CO, HUMEDAD]
 *           example: "HUMO"
 *         unidad_medida:
 *           type: string
 *           nullable: true
 *           example: "ppm"
 *         modelo:
 *           type: string
 *           nullable: true
 *           example: "MQ-2"
 *         fabricante:
 *           type: string
 *           nullable: true
 *           example: "Acme Sensores"
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, MANTENIMIENTO, ERROR]
 *           example: "ACTIVO"
 *         rango_min:
 *           type: number
 *           example: 0
 *         rango_max:
 *           type: number
 *           example: 100
 *         ultima_lectura:
 *           type: object
 *           nullable: true
 *           description: Solo presente en el detalle de un sensor.
 *           allOf:
 *             - $ref: '#/components/schemas/Lectura'
 *         predio:
 *           type: object
 *           nullable: true
 *           description: Solo presente en el detalle de un sensor.
 *           properties:
 *             id_predio:
 *               type: integer
 *             nombre:
 *               type: string
 *             latitud:
 *               type: number
 *             longitud:
 *               type: number
 *
 *     CreateSensor:
 *       type: object
 *       required:
 *         - id_predio
 *         - nombre
 *         - tipo_sensor
 *         - rango_min
 *         - rango_max
 *       properties:
 *         id_predio:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Sensor Humo Patio"
 *         tipo_sensor:
 *           type: string
 *           enum: [TEMPERATURA, HUMO, CO, HUMEDAD]
 *           example: "HUMO"
 *         unidad_medida:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         fabricante:
 *           type: string
 *           nullable: true
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, MANTENIMIENTO, ERROR]
 *           default: "ACTIVO"
 *         rango_min:
 *           type: number
 *           example: 0
 *         rango_max:
 *           type: number
 *           example: 100
 *
 *     UpdateSensor:
 *       type: object
 *       description: Todos los campos son opcionales; solo se actualizan los que se envíen.
 *       properties:
 *         id_predio:
 *           type: integer
 *         nombre:
 *           type: string
 *         tipo_sensor:
 *           type: string
 *           enum: [TEMPERATURA, HUMO, CO, HUMEDAD]
 *         unidad_medida:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: string
 *           nullable: true
 *         fabricante:
 *           type: string
 *           nullable: true
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           nullable: true
 *         estado:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, MANTENIMIENTO, ERROR]
 *         rango_min:
 *           type: number
 *         rango_max:
 *           type: number
 *
 *     SensorListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Sensor'
 */
