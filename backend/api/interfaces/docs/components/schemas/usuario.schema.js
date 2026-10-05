/**
 * @openapi
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       description: >
 *         No incluye el campo "contrasena" en la respuesta por razones de
 *         seguridad.
 *       properties:
 *         id_usuario:
 *           type: integer
 *           example: 1
 *         id_rol:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         id_institucion:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Juan"
 *         telefono:
 *           type: string
 *           nullable: true
 *           example: "+591 70011223"
 *         multiF_S:
 *           type: boolean
 *           nullable: true
 *           example: true
 *         multiF_A:
 *           type: boolean
 *           nullable: true
 *           example: false
 *         correo:
 *           type: string
 *           example: "juan.perez@example.com"
 *         primer_apellido:
 *           type: string
 *           nullable: true
 *           example: "Perez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gomez"
 *
 *     CreateUsuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         id_rol:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         id_institucion:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Juan"
 *         telefono:
 *           type: string
 *           nullable: true
 *           example: "+591 70011223"
 *         multiF_S:
 *           type: boolean
 *           nullable: true
 *           example: true
 *         multiF_A:
 *           type: boolean
 *           nullable: true
 *           example: false
 *         contrasena:
 *           type: string
 *           format: password
 *           description: Se almacena hasheada con bcrypt; nunca en texto plano.
 *           example: "S3cr3ta123!"
 *         correo:
 *           type: string
 *           example: "juan.perez@example.com"
 *         primer_apellido:
 *           type: string
 *           nullable: true
 *           example: "Perez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gomez"
 *
 *     UpdateUsuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *       properties:
 *         id_rol:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         id_institucion:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "Juan"
 *         telefono:
 *           type: string
 *           nullable: true
 *           example: "+591 70011223"
 *         multiF_S:
 *           type: boolean
 *           nullable: true
 *           example: true
 *         multiF_A:
 *           type: boolean
 *           nullable: true
 *           example: false
 *         contrasena:
 *           type: string
 *           format: password
 *           nullable: true
 *           description: >
 *             Opcional; si se omite se conserva la contraseña actual.
 *             Se almacena hasheada con bcrypt; nunca en texto plano.
 *           example: "NuevaClave456!"
 *         correo:
 *           type: string
 *           example: "juan.perez@example.com"
 *         primer_apellido:
 *           type: string
 *           nullable: true
 *           example: "Perez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gomez"
 *
 *     UsuarioListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Usuario'
 */
