/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - correo
 *         - contrasena
 *       properties:
 *         correo:
 *           type: string
 *           example: "juan.perez@example.com"
 *         contrasena:
 *           type: string
 *           format: password
 *           example: "S3cr3ta123!"
 */
