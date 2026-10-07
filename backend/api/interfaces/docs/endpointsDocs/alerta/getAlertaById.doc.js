/**
 * @openapi
 * /alertas/{id}:
 *   get:
 *     tags:
 *       - Alerta
 *     summary: Obtiene una alerta por ID
 *     description: Incluye el predio afectado, las lecturas que la generaron, las instituciones notificadas y el reporte ciudadano de origen (si existe).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 7
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Alerta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AlertaDetalle'
 *       404:
 *         description: Alerta no encontrada
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Alerta not found"
 */
