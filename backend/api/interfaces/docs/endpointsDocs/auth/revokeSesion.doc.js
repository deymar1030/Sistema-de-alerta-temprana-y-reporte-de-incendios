/**
 * @openapi
 * /auth/sesiones/{id}:
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Revoca una sesión del usuario autenticado
 *     description: >
 *       Cierra una sesión propia por id_sesion. Un usuario solo puede
 *       revocar sus propias sesiones. Si el id corresponde a la sesión
 *       actual, también se limpia la cookie "sid" del navegador.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Sesión revocada exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *       400:
 *         description: ID no válido
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "ID not valid"
 *               code: "VALIDATION_ERROR"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: >
 *           La sesión no existe, ya fue revocada, o no pertenece al usuario
 *           autenticado.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Sesión no encontrada"
 *               code: "SESSION_NOT_FOUND"
 */
