/**
 * @openapi
 * /reportes-usuario/{id}/estado:
 *   patch:
 *     tags:
 *       - ReporteU
 *     summary: Cambia el estado de revisión de un reporte
 *     description: Permite mover un reporte por su flujo de revisión.
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
 *             $ref: '#/components/schemas/UpdateEstadoReporteU'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Estado actualizado
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
 *                     id_reporte_u:
 *                       type: integer
 *                       example: 15
 *                     estado:
 *                       type: string
 *                       example: "VALIDADO"
 *       400:
 *         description: Error de validación o reporte no encontrado
 *         content:
 *           application/json:
 *             examples:
 *               validacion:
 *                 value:
 *                   success: false
 *                   error: "Validation errors: estado must be one of: RECIBIDO, EN_REVISION, VALIDADO, DESCARTADO, ATENDIDO"
 *               noEncontrado:
 *                 value:
 *                   success: false
 *                   error: "Reporte de usuario not found"
 */
