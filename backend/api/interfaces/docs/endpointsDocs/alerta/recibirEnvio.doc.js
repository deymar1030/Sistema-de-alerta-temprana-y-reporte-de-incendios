/**
 * @openapi
 * /alertas/{id}/instituciones/{id_institucion}/recibir:
 *   patch:
 *     tags:
 *       - Alerta
 *     summary: Marca el envío de una alerta a una institución como recibido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 7
 *       - in: path
 *         name: id_institucion
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Envío marcado como recibido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Envio'
 *       400:
 *         description: Envío no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Envio not found"
 */
