/**
 * @openapi
 * /usuarios/{id}:
 *   put:
 *     tags:
 *       - Usuario
 *     summary: Actualiza un usuario
 *     description: >
 *       Actualiza los datos de un usuario existente. Si no se envia
 *       "contrasena", se conserva la contraseña actual.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUsuario'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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
 *                   error: "Validation errors: Missing nombre, Missing correo"
 *               noEncontrado:
 *                 value:
 *                   success: false
 *                   error: "Usuario not found"
 */
