/**
 * @openapi
 * /notificaciones/leer-todas:
 *   patch:
 *     tags:
 *       - Notificacion
 *     summary: Marca todas las notificaciones del usuario autenticado como leídas
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Cantidad de notificaciones actualizadas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificacionesLeerTodas'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
