/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cierra la sesión actual
 *     description: Revoca la sesión asociada a la cookie "sid" y la elimina del navegador.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
