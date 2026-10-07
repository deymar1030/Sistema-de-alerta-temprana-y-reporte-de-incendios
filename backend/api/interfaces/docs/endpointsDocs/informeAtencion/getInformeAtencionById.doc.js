/**
 * @openapi
 * /informes-atencion/{id}:
 *   get:
 *     tags:
 *       - InformeAtencion
 *     summary: Obtiene un informe de atención por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Informe encontrado
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
 *       404:
 *         description: Informe no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Informe de atencion not found"
 */
