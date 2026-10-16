/**
 * @openapi
 * /notificaciones/{id}/leer:
 *   patch:
 *     tags:
 *       - Notificacion
 *     summary: Marca una notificación como leída
 *     description: Solo afecta notificaciones del usuario autenticado.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 101
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Notificación marcada como leída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificacionLeida'
 *       404:
 *         description: No existe o no pertenece al usuario autenticado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Notificacion not found"
 */
