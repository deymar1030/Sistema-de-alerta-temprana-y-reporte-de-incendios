/**
 * @openapi
 * /predios/{id}:
 *   put:
 *     tags:
 *       - Predio
 *     summary: Actualiza un predio
 *     description: >
 *       Actualiza los datos de un predio existente. Acepta actualizaciones
 *       parciales. Si se envía algún campo ordinal de riesgo, el IRP se
 *       recalcula automáticamente.
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
 *             $ref: '#/components/schemas/UpdatePredio'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Predio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Predio'
 *       400:
 *         description: Error de validación o predio no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Predio not found"
 */
