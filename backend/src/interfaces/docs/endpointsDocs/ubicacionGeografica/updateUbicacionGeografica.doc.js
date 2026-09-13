/**
 * @openapi
 * /ubicaciones-geograficas/{id}:
 *   put:
 *     tags:
 *       - UbicacionGeografica
 *     summary: Actualiza una ubicación geográfica
 *     description: Actualiza los datos de una ubicación geográfica existente.
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
 *             $ref: '#/components/schemas/UpdateUbicacionGeografica'
 *     responses:
 *       200:
 *         description: Ubicación geográfica actualizada exitosamente
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
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "latitud debe estar entre -90 y 90"
 *       404:
 *         description: Ubicación geográfica no encontrada
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Ubicación geográfica no encontrada"
 */