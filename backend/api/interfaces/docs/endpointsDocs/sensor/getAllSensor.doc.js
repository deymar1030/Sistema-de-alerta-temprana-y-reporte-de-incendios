/**
 * @openapi
 * /sensores:
 *   get:
 *     tags:
 *       - Sensor
 *     summary: Lista todos los sensores
 *     parameters:
 *       - in: query
 *         name: id_predio
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_sensor
 *         required: false
 *         schema:
 *           type: string
 *           enum: [TEMPERATURA, HUMO, CO, HUMEDAD]
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ACTIVO, INACTIVO, MANTENIMIENTO, ERROR]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de sensores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SensorListResponse'
 */
