/**
 * @openapi
 * /reportes-usuario:
 *   post:
 *     tags:
 *       - ReporteU
 *     summary: Crea un reporte ciudadano
 *     description: >
 *       Registra un nuevo reporte ciudadano. No se expone PUT ni DELETE:
 *       un reporte es evidencia, no se edita ni se borra.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReporteU'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Reporte creado exitosamente (estado inicial RECIBIDO)
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
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Validation errors: Missing id_usuario, Missing descripcion"
 */
