/**
 * @openapi
 * /informes-atencion:
 *   post:
 *     tags:
 *       - InformeAtencion
 *     summary: Crea un informe de atención institucional
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInformeAtencion'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Informe creado exitosamente
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
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Validation errors: Missing id_alerta, Missing id_institucion, Missing id_usuario"
 */
