/**
 * @openapi
 * /motores-deteccion/{id}:
 *   get:
 *     tags:
 *       - MotorDet
 *     summary: Obtiene un motor de deteccion por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Motor de deteccion no encontrado
 *       200:
 *         description: Motor de deteccion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MotorDet'
 */
