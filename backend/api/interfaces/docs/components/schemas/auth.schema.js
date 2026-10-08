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
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - nombre
 *         - primer_apellido
 *         - correo
 *         - contrasena
 *       properties:
 *         nombre:
 *           type: string
 *           example: "Juan"
 *         primer_apellido:
 *           type: string
 *           example: "Pérez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gómez"
 *         telefono:
 *           type: string
 *           nullable: true
 *           example: "+591 70012345"
 *         correo:
 *           type: string
 *           example: "juan.perez@correo.com"
 *         contrasena:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "Password123"
 */
