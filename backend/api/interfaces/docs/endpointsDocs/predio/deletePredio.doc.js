/**
 * @openapi
 * /predios/{id}:
 *   delete:
 *     tags:
 *       - Predio
 *     summary: Elimina un predio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Predio eliminado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: null
 *       400:
 *         description: Predio no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Predio not found"
 */
