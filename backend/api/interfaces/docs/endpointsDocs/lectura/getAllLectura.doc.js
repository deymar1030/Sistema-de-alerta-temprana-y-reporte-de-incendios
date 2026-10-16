/**
 * @openapi
 * /lecturas:
 *   get:
 *     tags:
 *       - Lectura
 *     summary: Lista las lecturas registradas por los sensores
 *     description: Las lecturas las inserta el motor de detección vía MQTT; este endpoint es solo de consulta.
 *     parameters:
 *       - in: query
 *         name: id_sensor
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_predio
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo_variable
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado_lectura
 *         required: false
 *         schema:
 *           type: string
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
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Página de lecturas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LecturaPaginatedResponse'
 */
