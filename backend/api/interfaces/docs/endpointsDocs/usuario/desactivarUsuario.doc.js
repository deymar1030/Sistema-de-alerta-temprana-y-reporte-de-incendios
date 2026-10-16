/**
 * @openapi
 * /usuarios/{id}/desactivar:
 *   patch:
 *     tags:
 *       - Usuario
 *     summary: Da de baja a un usuario
 *     description: Marca al usuario como eliminado (soft delete) registrando la fecha de baja.
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
 *         description: Usuario dado de baja exitosamente
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
