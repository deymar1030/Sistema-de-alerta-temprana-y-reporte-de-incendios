/**
 * @openapi
 * /instituciones:
 *   get:
 *     tags:
 *       - Institucion
 *     summary: Lista todas las instituciones
 *     description: Retorna la lista completa de instituciones registradas.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de instituciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InstitucionListResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Error al obtener las instituciones"
 */
