/**
 * @openapi
 * /reportes-usuario:
 *   get:
 *     tags:
 *       - ReporteU
 *     summary: Lista los reportes ciudadanos
 *     description: Retorna los reportes ciudadanos, con filtros opcionales.
 *     parameters:
 *       - in: query
 *         name: id_usuario
 *         schema:
 *           type: integer
 *       - in: query
 *         name: nivel_prioridad
 *         schema:
 *           type: string
 *           enum: [BAJA, MEDIA, ALTA]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [RECIBIDO, EN_REVISION, VALIDADO, DESCARTADO, ATENDIDO]
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date-time
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de reportes ciudadanos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReporteUListResponse'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
