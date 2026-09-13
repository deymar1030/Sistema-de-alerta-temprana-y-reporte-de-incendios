/**
 * @openapi
 * /ubicaciones-geograficas/{id}:
 *   delete:
 *     tags:
 *       - UbicacionGeografica
 *     summary: Elimina una ubicación geográfica
 *     description: Elimina una ubicación geográfica existente por su id_ubic_geo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Ubicación geográfica eliminada exitosamente
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