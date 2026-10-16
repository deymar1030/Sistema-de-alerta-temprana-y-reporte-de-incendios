/**
 * @openapi
 * /sensores/{id}:
 *   put:
 *     tags:
 *       - Sensor
 *     summary: Actualiza un sensor
 *     description: Actualiza los datos de un sensor existente. Acepta actualizaciones parciales.
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
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Sensor actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Error de validación o sensor no encontrado
 *         content:
 *           application/json:
 *             examples:
 *               validacion:
 *                 value:
 *                   success: false
 *                   error: "Validation errors: estado must be one of: ACTIVO, INACTIVO, MANTENIMIENTO, ERROR"
 *               noEncontrado:
 *                 value:
 *                   success: false
 *                   error: "Sensor not found"
 */
