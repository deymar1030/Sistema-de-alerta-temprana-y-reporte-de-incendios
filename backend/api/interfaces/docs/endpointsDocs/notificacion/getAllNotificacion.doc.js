/**
 * @openapi
 * /notificaciones:
 *   get:
 *     tags:
 *       - Notificacion
 *     summary: Lista la bandeja de notificaciones del usuario autenticado
 *     description: >
 *       Siempre escopeado al usuario de la sesión (nunca a un parámetro
 *       que mande el cliente).
 *     parameters:
 *       - in: query
 *         name: leida
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [ALERTA, ENVIO, REPORTE, SISTEMA]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Bandeja de notificaciones del usuario
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
