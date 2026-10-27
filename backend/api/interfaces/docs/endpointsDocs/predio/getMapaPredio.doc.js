/**
 * @openapi
 * /predios/mapa:
 *   get:
 *     tags:
 *       - Predio
 *     summary: Lista los predios con los datos mínimos para ubicarlos en un mapa
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de predios para el mapa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PredioMapaListResponse'
 */
