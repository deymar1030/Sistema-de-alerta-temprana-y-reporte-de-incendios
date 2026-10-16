/**
 * @openapi
 * /informes-atencion/{id}:
 *   put:
 *     tags:
 *       - InformeAtencion
 *     summary: Actualiza un informe de atención
 *     description: Actualiza los datos de un informe existente. Acepta actualizaciones parciales; no hay eliminar.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInformeAtencion'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Informe actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InformeAtencion'
 *       400:
 *         description: Error de validación o informe no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Informe de atencion not found"
 */
