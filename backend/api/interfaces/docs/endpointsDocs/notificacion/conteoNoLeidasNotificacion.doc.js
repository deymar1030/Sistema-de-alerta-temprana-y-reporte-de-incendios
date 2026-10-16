/**
 * @openapi
 * /notificaciones/no-leidas/conteo:
 *   get:
 *     tags:
 *       - Notificacion
 *     summary: Cuenta las notificaciones no leídas del usuario autenticado
 *     description: Para el badge numérico de la campana de notificaciones.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Conteo de notificaciones no leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ConteoNoLeidas'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
