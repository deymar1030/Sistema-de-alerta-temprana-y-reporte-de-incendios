/**
 * @openapi
 * /zonas-geograficas/{id}:
 *   put:
 *     tags:
 *       - ZonaGeografica
 *     summary: Actualizar una zona geográfica existente
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
 *             $ref: '#/components/schemas/UpdateZonaGeografica'
 *     responses:
 *       200:
 *         description: Zona geográfica actualizada correctamente
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
