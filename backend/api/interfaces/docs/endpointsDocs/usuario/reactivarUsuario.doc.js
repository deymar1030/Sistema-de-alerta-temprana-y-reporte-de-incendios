/**
 * @openapi
 * /usuarios/{id}/reactivar:
 *   patch:
 *     tags:
 *       - Usuario
 *     summary: Reactiva a un usuario dado de baja
 *     description: Limpia la fecha de baja del usuario.
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
 *         description: Usuario reactivado exitosamente
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
 *       400:
 *         description: Error de validación o usuario no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Usuario not found"
 */
