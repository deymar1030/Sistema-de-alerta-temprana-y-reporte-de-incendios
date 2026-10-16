/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Obtiene el usuario autenticado
 *     description: Retorna los datos del usuario dueño de la sesión actual.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
