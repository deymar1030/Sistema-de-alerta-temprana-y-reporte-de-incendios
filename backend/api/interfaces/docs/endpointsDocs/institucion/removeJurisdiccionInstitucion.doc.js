/**
 * @openapi
 * /instituciones/{id}/jurisdicciones/{id_zona}:
 *   delete:
 *     tags:
 *       - Institucion
 *     summary: Quita una zona geográfica de la jurisdicción de una institución
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: path
 *         name: id_zona
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
 *         description: Jurisdicción eliminada exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
