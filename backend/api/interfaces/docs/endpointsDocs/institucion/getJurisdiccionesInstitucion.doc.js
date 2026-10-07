/**
 * @openapi
 * /instituciones/{id}/jurisdicciones:
 *   get:
 *     tags:
 *       - Institucion
 *     summary: Lista las zonas geográficas que cubre una institución
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
 *         description: Lista de zonas geográficas cubiertas por la institución
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ZonaGeograficaListResponse'
 */
