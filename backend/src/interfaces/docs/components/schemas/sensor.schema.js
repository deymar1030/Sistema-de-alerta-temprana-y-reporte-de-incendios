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
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         estado:
 *           type: string
 *           example: "Activo"
 *         tipo_sensor:
 *           type: string
 *           example: "Temperatura"
 *         unidad_medida:
 *           type: string
 *           example: "Celsius"
 *         nombre:
 *           type: string
 *           example: "Sensor Norte 01"
 *         modelo:
 *           type: string
 *           example: "DHT22"
 *         fabricante:
 *           type: string
 *           example: "Aosong"
 *
 *     CreateSensor:
 *       type: object
 *       required:
 *         - fecha_instalacion
 *         - estado
 *         - tipo_sensor
 *         - unidad_medida
 *         - nombre
 *         - modelo
 *         - fabricante
 *         - id_ubic_geo
 *       properties:
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         estado:
 *           type: string
 *           example: "Activo"
 *         tipo_sensor:
 *           type: string
 *           example: "Temperatura"
 *         unidad_medida:
 *           type: string
 *           example: "Celsius"
 *         nombre:
 *           type: string
 *           example: "Sensor Norte 01"
 *         modelo:
 *           type: string
 *           example: "DHT22"
 *         fabricante:
 *           type: string
 *           example: "Aosong"
 *         id_ubic_geo:
 *           type: integer
 *           example: 1
 *
 *     UpdateSensor:
 *       type: object
 *       properties:
 *         fecha_instalacion:
 *           type: string
 *           format: date
 *           example: "2026-01-15"
 *         estado:
 *           type: string
 *           example: "Inactivo"
 *         tipo_sensor:
 *           type: string
 *           example: "Temperatura"
 *         unidad_medida:
 *           type: string
 *           example: "Celsius"
 *         nombre:
 *           type: string
 *           example: "Sensor Norte 01"
 *         modelo:
 *           type: string
 *           example: "DHT22"
 *         fabricante:
 *           type: string
 *           example: "Aosong"
 *
 *     SensorListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Sensor'
 */
