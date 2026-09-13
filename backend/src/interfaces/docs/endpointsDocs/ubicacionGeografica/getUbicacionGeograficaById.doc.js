/**
 * @openapi
 * /ubicaciones-geograficas/{id}:
 *   get:
 *     tags:
 *       - UbicacionGeografica
 *     summary: Obtiene una ubicación geográfica por ID
 *     description: Retorna una ubicación geográfica específica según su id_ubic_geo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Ubicación geográfica encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UbicacionGeografica'
 *       404:
 *         description: Ubicación geográfica no encontrada
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Ubicación geográfica no encontrada"
 */