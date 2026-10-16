/**
 * @openapi
 * /sensores/{id}/lecturas:
 *   get:
 *     tags:
 *       - Sensor
 *     summary: Lista las lecturas registradas por un sensor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de lecturas del sensor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lectura'
 *       404:
 *         description: Sensor no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Sensor not found"
 */
