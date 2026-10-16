/**
 * @openapi
 * /sensores:
 *   post:
 *     tags:
 *       - Sensor
 *     summary: Crea un nuevo sensor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSensor'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Sensor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Validation errors: Missing id_predio, Missing nombre"
 */
