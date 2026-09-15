/**
 * @openapi
 * /instituciones/{id}:
 *   put:
 *     tags:
 *       - Institucion
 *     summary: Actualiza una institución
 *     description: Actualiza los datos de una institución existente.
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
 *             $ref: '#/components/schemas/UpdateInstitucion'
 *     responses:
 *       200:
 *         description: Institución actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Institucion'
 *       400:
 *         description: Error de validación o institución no encontrada
 *         content:
 *           application/json:
 *             examples:
 *               validacion:
 *                 value:
 *                   success: false
 *                   error: "Validation errors: Missing categoria, Missing nombre"
 *               noEncontrada:
 *                 value:
 *                   success: false
 *                   error: "Institucion not found"
 */
