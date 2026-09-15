/**
 * @openapi
 * /instituciones/{id}:
 *   get:
 *     tags:
 *       - Institucion
 *     summary: Obtiene una institución por ID
 *     description: Retorna una institución específica según su id_institucion.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Institución encontrada
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
 *       404:
 *         description: Institución no encontrada
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Institucion not found"
 */
