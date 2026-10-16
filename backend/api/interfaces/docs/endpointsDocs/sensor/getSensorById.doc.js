/**
 * @openapi
 * /sensores/{id}:
 *   get:
 *     tags:
 *       - Sensor
 *     summary: Obtiene un sensor por ID
 *     description: Incluye la última lectura registrada y los datos del predio.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Sensor encontrado
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
 *       404:
 *         description: Sensor no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Sensor not found"
 */
