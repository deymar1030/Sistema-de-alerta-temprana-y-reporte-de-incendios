/**
 * @openapi
 * /reportes-usuario/{id}/vincular-alerta:
 *   patch:
 *     tags:
 *       - ReporteU
 *     summary: Vincula un reporte a una alerta
 *     description: Crea el vínculo en la tabla genera_ru entre el reporte y la alerta.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 15
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VincularAlertaReporteU'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Vínculo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_alerta:
 *                       type: integer
 *                       example: 7
 *                     id_reporte_u:
 *                       type: integer
 *                       example: 15
 *       400:
 *         description: Error de validación o reporte no encontrado
 *         content:
 *           application/json:
 *             examples:
 *               validacion:
 *                 value:
 *                   success: false
 *                   error: "Validation errors: id_alerta not valid"
 *               noEncontrado:
 *                 value:
 *                   success: false
 *                   error: "Reporte de usuario not found"
 */
