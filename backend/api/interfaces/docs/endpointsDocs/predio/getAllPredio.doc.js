/**
 * @openapi
 * /predios:
 *   get:
 *     tags:
 *       - Predio
 *     summary: Lista todos los predios
 *     parameters:
 *       - in: query
 *         name: id_zona
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_predio
 *         required: false
 *         schema:
 *           type: string
 *           enum: [VIVIENDA, EDIFICIO, MERCADO]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de predios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PredioListResponse'
 */
