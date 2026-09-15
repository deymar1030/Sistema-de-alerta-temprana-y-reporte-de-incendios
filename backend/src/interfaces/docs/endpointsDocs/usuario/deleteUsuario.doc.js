/**
 * @openapi
 * /usuarios/{id}:
 *   delete:
 *     tags:
 *       - Usuario
 *     summary: Elimina un usuario
 *     description: Elimina un usuario existente por su id_usuario.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
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
 *             examples:
 *               validacion:
 *                 value:
 *                   success: false
 *                   error: "Validation errors: ID not valid"
 *               noEncontrado:
 *                 value:
 *                   success: false
 *                   error: "Usuario not found"
 */
