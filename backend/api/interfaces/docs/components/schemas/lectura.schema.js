/**
 * @openapi
 * components:
 *   schemas:
 *     Lectura:
 *       type: object
 *       properties:
 *         id_lectura:
 *           type: integer
 *           example: 10234
 *         id_sensor:
 *           type: integer
 *           example: 31
 *         id_alerta:
 *           type: integer
 *           nullable: true
 *           example: null
 *         valor:
 *           type: number
 *           example: 24.6
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           example: "2026-10-02T09:15:00Z"
 *         estado_lectura:
 *           type: string
 *           example: "VALIDA"
 *         tipo_variable:
 *           type: string
 *           example: "TEMPERATURA"
 *
 *     LecturaPaginatedResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Lectura'
 *         total:
 *           type: integer
 *           example: 540
 *         page:
 *           type: integer
 *           example: 1
 *         pageSize:
 *           type: integer
 *           example: 50
 */
