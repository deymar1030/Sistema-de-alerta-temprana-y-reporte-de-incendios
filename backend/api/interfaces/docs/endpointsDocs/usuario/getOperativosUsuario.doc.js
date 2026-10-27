/**
 * @openapi
 * /usuarios/operativos:
 *   get:
 *     tags:
 *       - Usuario
 *     summary: Lista los OPERATIVO de la institución del JEFE_INSTITUCION logueado
 *     description: >
 *       Solo JEFE_INSTITUCION. Devuelve los usuarios activos con rol
 *       OPERATIVO de su misma institución, para elegir a quién asignarle
 *       una alerta.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       200:
 *         description: Lista de operativos
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
 *                     $ref: '#/components/schemas/Usuario'
 */
