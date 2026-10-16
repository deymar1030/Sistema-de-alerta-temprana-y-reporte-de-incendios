/**
 * @openapi
 * components:
 *   schemas:
 *     Alerta:
 *       type: object
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2026-10-02"
 *         hora:
 *           type: string
 *           example: "18:10:00"
 *         estado:
 *           type: string
 *           enum: [EN_EVALUACION, CONFIRMADA, DESCARTADA, ATENDIDA, CERRADA]
 *           example: "CONFIRMADA"
 *         puntaje:
 *           type: number
 *           nullable: true
 *           example: 0.76
 *         clasificacion:
 *           type: string
 *           nullable: true
 *           example: "INCENDIO"
 *         fecha_confirmacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         fecha_cierre:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     AlertaListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Alerta'
 *
 *     InstitucionNotificada:
 *       type: object
 *       properties:
 *         id_institucion:
 *           type: integer
 *           example: 3
 *         nombre:
 *           type: string
 *           example: "Bomberos Voluntarios La Paz"
 *         estado:
 *           type: string
 *           enum: [ENVIADA, RECIBIDA, ATENDIDA, CERRADA]
 *           example: "RECIBIDA"
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     AlertaDetalle:
 *       allOf:
 *         - $ref: '#/components/schemas/Alerta'
 *         - type: object
 *           properties:
 *             predio:
 *               allOf:
 *                 - $ref: '#/components/schemas/PredioMapa'
 *               nullable: true
 *             lecturas:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lectura'
 *             instituciones_notificadas:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InstitucionNotificada'
 *             reporte_origen:
 *               type: object
 *               nullable: true
 *               description: Reporte ciudadano que originó la alerta, si aplica.
 *
 *     Envio:
 *       type: object
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         id_institucion:
 *           type: integer
 *           example: 3
 *         estado:
 *           type: string
 *           enum: [ENVIADA, RECIBIDA, ATENDIDA, CERRADA]
 *           example: "RECIBIDA"
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 */
