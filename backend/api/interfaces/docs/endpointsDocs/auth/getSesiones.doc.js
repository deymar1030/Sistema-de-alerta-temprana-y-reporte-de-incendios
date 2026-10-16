/**
 * @openapi
 * /auth/sesiones:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Lista las sesiones activas del usuario autenticado
 *     description: >
 *       Retorna todas las sesiones vigentes del usuario dueño de la sesión actual.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SesionListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
