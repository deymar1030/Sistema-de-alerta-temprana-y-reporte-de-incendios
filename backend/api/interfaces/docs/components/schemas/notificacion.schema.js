/**
 * @openapi
 * components:
 *   schemas:
 *     Notificacion:
 *       type: object
 *       properties:
 *         id_notificacion:
 *           type: integer
 *           example: 101
 *         id_usuario_emisor:
 *           type: integer
 *           nullable: true
 *           description: Quien la genero (ej. el JEFE_INSTITUCION que asigno la alerta). Null si la genero el sistema.
 *           example: 5
 *         id_alerta:
 *           type: integer
 *           nullable: true
 *           example: 7
 *         tipo:
 *           type: string
 *           enum: [ALERTA, ENVIO, REPORTE, SISTEMA]
 *           example: "ALERTA"
 *         titulo:
 *           type: string
 *           example: "Alerta confirmada: Mercado Rodríguez"
 *         mensaje:
 *           type: string
 *           example: "Se confirmó un incendio en Mercado Rodríguez con riesgo alto."
 *         fecha_hora:
 *           type: string
 *           format: date-time
 *           example: "2026-10-02T18:12:30Z"
 *         leida:
 *           type: boolean
 *           example: false
 *
 *     NotificacionListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Notificacion'
 *
 *     ConteoNoLeidas:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 4
 *
 *     NotificacionLeida:
 *       type: object
 *       properties:
 *         id_notificacion:
 *           type: integer
 *           example: 101
 *         leida:
 *           type: boolean
 *           example: true
 *
 *     NotificacionesLeerTodas:
 *       type: object
 *       properties:
 *         actualizadas:
 *           type: integer
 *           example: 4
 *
 *     AsignarAlertaOperativosRequest:
 *       type: object
 *       required:
 *         - id_alerta
 *         - id_usuarios
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         id_usuarios:
 *           type: array
 *           description: IDs de usuarios OPERATIVO de la misma institucion que el JEFE_INSTITUCION.
 *           items:
 *             type: integer
 *           example: [12, 15]
 */
