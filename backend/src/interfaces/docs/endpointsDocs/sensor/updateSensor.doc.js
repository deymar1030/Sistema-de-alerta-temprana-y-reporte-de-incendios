/**
 * @openapi
 * /sensores/{id}:
 *   put:
 *     tags:
 *       - Sensor
 *     summary: Actualiza un sensor
 *     description: Actualiza los datos de un sensor existente.
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
 *             $ref: '#/components/schemas/UpdateSensor'
 *     responses:
 *       200:
 *         description: Sensor actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               error: "El id del sensor es obligatorio para actualizar"
 */
