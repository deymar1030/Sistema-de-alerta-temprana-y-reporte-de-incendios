/**
 * @openapi
 * /motores-deteccion:
 *   get:
 *     tags:
 *       - MotorDet
 *     summary: Lista los motores de deteccion disponibles
 *     description: Solo lectura. Un predio referencia uno de estos motores (id_motordet) al crearse.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de motores de deteccion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MotorDetListResponse'
 */
