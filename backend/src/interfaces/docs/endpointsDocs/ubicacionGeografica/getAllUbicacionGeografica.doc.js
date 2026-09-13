/**
 * @openapi
 * /ubicaciones-geograficas:
 *   get:
 *     tags:
 *       - UbicacionGeografica
 *     summary: Lista todas las ubicaciones geográficas
 *     description: Retorna la lista completa de ubicaciones geográficas registradas.
 *     responses:
 *       200:
 *         description: Lista de ubicaciones geográficas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UbicacionGeograficaListResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Error al obtener las ubicaciones geográficas"
 */