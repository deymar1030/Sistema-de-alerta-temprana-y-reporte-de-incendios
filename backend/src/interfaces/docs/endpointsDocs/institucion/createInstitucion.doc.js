/**
 * @openapi
 * /instituciones:
 *   post:
 *     tags:
 *       - Institucion
 *     summary: Crea una nueva institución
 *     description: Registra una nueva institución en el sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInstitucion'
 *     responses:
 *       201:
 *         description: Institución creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Institucion'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Validation errors: Missing categoria, Missing nombre"
 */
