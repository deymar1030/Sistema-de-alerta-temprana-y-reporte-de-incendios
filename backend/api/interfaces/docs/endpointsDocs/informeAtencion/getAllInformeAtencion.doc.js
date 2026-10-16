/**
 * @openapi
 * /informes-atencion:
 *   get:
 *     tags:
 *       - InformeAtencion
 *     summary: Lista los informes de atención institucional
 *     parameters:
 *       - in: query
 *         name: id_institucion
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_alerta
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [BORRADOR, COMPLETADO]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de informes de atención
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InformeAtencionListResponse'
 */
