/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Inicia sesión
 *     description: >
 *       Autentica al usuario por correo y contraseña y crea una sesión nueva.
 *       Si el navegador ya tenía una cookie de sesión válida, se revoca antes
 *       de emitir la nueva (evita fijación de sesión). El token de sesión se
 *       entrega como cookie httpOnly "sid"; no aparece en el cuerpo de la
 *       respuesta. Sujeto a un límite de intentos fallidos por cuenta y a un
 *       límite de peticiones por IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 *         headers:
 *           Set-Cookie:
 *             description: Cookie de sesión httpOnly "sid"
 *             schema:
 *               type: string
 *               example: "sid=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Lax"
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
 *               error: "Validation errors: Missing correo, Missing contrasena"
 *               code: "VALIDATION_ERROR"
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Credenciales inválidas"
 *               code: "INVALID_CREDENTIALS"
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         description: Demasiados intentos de inicio de sesión desde la IP.
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Demasiados intentos. Intenta más tarde"
 *               code: "TOO_MANY_REQUESTS"
 */
