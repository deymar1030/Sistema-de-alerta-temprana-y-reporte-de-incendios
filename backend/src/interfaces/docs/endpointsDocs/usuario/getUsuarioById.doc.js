/**
 * @openapi
 * /usuarios/{id}:
 *   get:
 *     tags:
 *       - Usuario
 *     summary: Obtiene un usuario por ID
 *     description: Retorna un usuario específico según su id_usuario.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Usuario not found"
 */
