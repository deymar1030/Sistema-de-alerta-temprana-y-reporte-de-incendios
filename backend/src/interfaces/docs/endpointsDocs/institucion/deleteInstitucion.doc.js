/**
 * @openapi
 * /instituciones/{id}:
 *   delete:
 *     tags:
 *       - Institucion
 *     summary: Elimina una institución
 *     description: Elimina una institución existente por su id_institucion.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Institución eliminada exitosamente
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
 *                   error: "Validation errors: ID not valid"
 *               noEncontrada:
 *                 value:
 *                   success: false
 *                   error: "Institucion not found"
 */
