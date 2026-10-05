/**
 * @openapi
 * /reportes-usuario/{id}:
 *   get:
 *     tags:
 *       - ReporteU
 *     summary: Obtiene un reporte ciudadano por ID
 *     description: >
 *       Retorna un reporte ciudadano con alerta_vinculada si ya se asoció
 *       a una alerta (vía la tabla genera_ru), o null si no.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 15
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Reporte encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReporteU'
 *       404:
 *         description: Reporte no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Reporte de usuario not found"
 */
