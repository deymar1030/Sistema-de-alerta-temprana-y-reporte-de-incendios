/**
 * @openapi
 * /sensores/{id}:
 *   get:
 *     tags:
 *       - Sensor
 *     summary: Obtiene un sensor por ID
 *     description: Retorna un sensor específico según su id_sensor.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Sensor encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor no encontrado
 *         content:
 *           application/json:
 *             example:
 *               error: "Sensor no encontrado"
 */
