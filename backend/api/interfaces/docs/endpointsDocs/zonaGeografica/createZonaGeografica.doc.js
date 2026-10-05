/**
 * @openapi
 * /zonas-geograficas:
 *   post:
 *     tags:
 *       - ZonaGeografica
 *     summary: Crear una nueva zona geográfica
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateZonaGeografica'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Zona geográfica creada correctamente
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
