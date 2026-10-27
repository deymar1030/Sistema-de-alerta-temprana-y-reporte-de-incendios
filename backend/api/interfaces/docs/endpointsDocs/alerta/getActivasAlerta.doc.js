/**
 * @openapi
 * /alertas/activas:
 *   get:
 *     tags:
 *       - Alerta
 *     summary: Lista las alertas activas
 *     description: Misma forma que el listado general, filtrado a los estados EN_EVALUACION, CONFIRMADA y ATENDIDA.
 *     parameters:
 *       - in: query
 *         name: clasificacion
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_zona
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_institucion
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: desde
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de alertas activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AlertaListResponse'
 */
