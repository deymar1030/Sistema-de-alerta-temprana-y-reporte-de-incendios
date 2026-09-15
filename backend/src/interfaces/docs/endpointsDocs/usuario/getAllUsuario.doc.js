/**
 * @openapi
 * /usuarios:
 *   get:
 *     tags:
 *       - Usuario
 *     summary: Lista todos los usuarios
 *     description: Retorna la lista completa de usuarios registrados.
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UsuarioListResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Error al obtener los usuarios"
 */
