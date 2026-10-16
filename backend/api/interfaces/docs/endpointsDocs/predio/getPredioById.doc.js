/**
 * @openapi
 * /predios/{id}:
 *   get:
 *     tags:
 *       - Predio
 *     summary: Obtiene un predio por ID
 *     description: Incluye los sensores instalados en el predio.
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
 *         description: Predio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Predio'
 *       404:
 *         description: Predio no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Predio not found"
 */
