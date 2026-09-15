/**
 * @openapi
 * /sensores/{id}:
 *   delete:
 *     tags:
 *       - Sensor
 *     summary: Elimina un sensor
 *     description: Elimina un sensor existente por su id_sensor.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Sensor eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor no encontrado
 *         content:
 *           application/json:
 *             example:
 *               error: "El id del sensor es obligatorio para eliminar"
 */
