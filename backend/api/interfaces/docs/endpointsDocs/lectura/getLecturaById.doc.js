/**
 * @openapi
 * /lecturas/{id}:
 *   get:
 *     tags:
 *       - Lectura
 *     summary: Obtiene una lectura por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10234
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lectura encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Lectura'
 *       404:
 *         description: Lectura no encontrada
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Lectura not found"
 */
