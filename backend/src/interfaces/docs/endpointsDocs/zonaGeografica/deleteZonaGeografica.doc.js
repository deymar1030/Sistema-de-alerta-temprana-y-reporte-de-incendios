/**
 * @openapi
 * /zonas-geograficas/{id}:
 *   delete:
 *     tags:
 *       - ZonaGeografica
 *     summary: Eliminar una zona geográfica
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Zona geográfica eliminada correctamente
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
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
