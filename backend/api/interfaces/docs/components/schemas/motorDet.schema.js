/**
 * @openapi
 * components:
 *   schemas:
 *     ParametroVariable:
 *       type: object
 *       properties:
 *         id_parametro_variable:
 *           type: integer
 *           example: 1
 *         tipo_variable:
 *           type: string
 *           enum: [TEMPERATURA, HUMEDAD, CO2, GAS_LEL, HUMO, CO]
 *           example: "TEMPERATURA"
 *         umbral_critico:
 *           type: number
 *           nullable: true
 *           example: 70
 *
 *     MotorDet:
 *       type: object
 *       properties:
 *         id_motordet:
 *           type: integer
 *           example: 1
 *         ventana_base_min:
 *           type: integer
 *           example: 30
 *         umbral_z:
 *           type: number
 *           example: 3
 *         cusum_h:
 *           type: number
 *           example: 5
 *         umbral_confirmacion:
 *           type: number
 *           example: 0.6
 *         umbral_descarte:
 *           type: number
 *           example: 0.45
 *         tiempo_max_evaluacion_min:
 *           type: integer
 *           example: 10
 *         radio_vecindad_m:
 *           type: integer
 *           example: 500
 *         parametro_variable:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ParametroVariable'
 *
 *     MotorDetListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/MotorDet'
 */
