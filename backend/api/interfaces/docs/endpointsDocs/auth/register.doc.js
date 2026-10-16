/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Auto-registro de ciudadano
 *     description: >
 *       Crea una cuenta pública con rol CIUDADANO (fijo, no configurable
 *       desde el body). No inicia sesión automáticamente: hay que llamar a
 *       POST /auth/login después con las mismas credenciales.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Validation errors: Missing nombre, Missing primer_apellido"
 *               code: "VALIDATION_ERROR"
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: El correo ya está registrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "El correo ya está registrado"
 *               code: "CORREO_YA_REGISTRADO"
 */
