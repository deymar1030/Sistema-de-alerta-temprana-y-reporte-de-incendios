/**
 * @openapi
 * /usuarios:
 *   get:
 *     tags:
 *       - Usuario
 *     summary: Lista todos los usuarios
 *     description: Retorna la lista completa de usuarios registrados. Por defecto excluye a los usuarios dados de baja.
 *     parameters:
 *       - in: query
 *         name: id_institucion
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: incluirEliminados
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
