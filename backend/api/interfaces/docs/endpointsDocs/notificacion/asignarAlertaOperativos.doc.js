/**
 * @openapi
 * /notificaciones/asignaciones:
 *   post:
 *     tags:
 *       - Notificacion
 *     summary: Asigna una alerta a operativos de la institución
 *     description: >
 *       Solo JEFE_INSTITUCION. Reparte una alerta ya enviada a su institución
 *       (debe existir fila en `envia`) entre uno o más OPERATIVO de esa misma
 *       institución. Crea una notificación por destinatario y la emite en
 *       vivo por WebSocket ("notificacion:nueva").
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AsignarAlertaOperativosRequest'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Rol insuficiente (no es JEFE_INSTITUCION) o el usuario destino no es OPERATIVO de la misma institución.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "No tiene permisos para esta acción"
 *               code: "FORBIDDEN"
 *       201:
 *         description: Notificaciones creadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificacionListResponse'
 *       400:
 *         description: Alerta no enviada a la institución, o usuarios inválidos
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Usuario(s) no válidos: no son OPERATIVO activo de tu institución: 99"
 */
