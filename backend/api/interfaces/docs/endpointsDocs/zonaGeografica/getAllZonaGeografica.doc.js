/**
 * @openapi
 * /zonas-geograficas:
 *   get:
 *     tags:
 *       - ZonaGeografica
 *     summary: Listar todas las zonas geográficas
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de zonas geográficas
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
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
