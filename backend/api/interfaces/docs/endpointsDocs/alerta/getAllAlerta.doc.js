/**
 * @openapi
 * /alertas:
 *   get:
 *     tags:
 *       - Alerta
 *     summary: Lista las alertas
 *     description: No hay crear/editar manual; el motor de detección confirma o descarta las alertas automáticamente.
 *     parameters:
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [EN_EVALUACION, CONFIRMADA, DESCARTADA, ATENDIDA, CERRADA]
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
 *         description: Lista de alertas
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
