/**
 * @openapi
 * /zonas-geograficas/{id}:
 *   get:
 *     tags:
 *       - ZonaGeografica
 *     summary: Obtener una zona geográfica por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Zona geográfica encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ZonaGeografica'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
