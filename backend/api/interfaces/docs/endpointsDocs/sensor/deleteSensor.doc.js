/**
 * @openapi
 * /sensores/{id}:
 *   delete:
 *     tags:
 *       - Sensor
 *     summary: Elimina un sensor
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
 *         description: Sensor eliminado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: null
 *       400:
 *         description: Sensor no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Sensor not found"
 */
