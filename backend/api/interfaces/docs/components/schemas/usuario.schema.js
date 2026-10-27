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
 *           example: 1
 *         nombre_rol:
 *           type: string
 *           description: >
 *             Nombre del rol (tabla "rol"); se adjunta solo para lectura,
 *             no reemplaza a id_rol.
 *           example: "CIUDADANO"
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
 *         correo:
 *           type: string
 *           example: "juan.perez@example.com"
 *         primer_apellido:
 *           type: string
 *           example: "Perez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gomez"
 *         fecha_eliminacion:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Fecha en la que se dio de baja al usuario; null si está activo.
 *         estado:
 *           type: boolean
 *           example: true
 *
 *     CreateUsuario:
 *       type: object
 *       description: >
 *         El rol se indica con id_rol o con nombre_rol (si se envian ambos,
 *         nombre_rol tiene prioridad); nombre_rol se resuelve con
 *         rolRepository.findOrCreateByNombre.
 *       required:
 *         - nombre
 *         - primer_apellido
 *         - correo
 *         - contrasena
 *       properties:
 *         id_rol:
 *           type: integer
 *           example: 1
 *         nombre_rol:
 *           type: string
 *           example: "CIUDADANO"
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
 *           example: "Perez"
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *           example: "Gomez"
 *
 *     UpdateUsuario:
 *       type: object
 *       description: >
 *         Todos los campos son opcionales; solo se actualizan los que se
 *         envíen. No permite cambiar la contraseña (eso no forma parte de
 *         este endpoint).
 *       properties:
 *         id_rol:
 *           type: integer
 *         nombre_rol:
 *           type: string
 *           example: "OPERATIVO"
 *         id_institucion:
 *           type: integer
 *           nullable: true
 *         nombre:
 *           type: string
 *         telefono:
 *           type: string
 *           nullable: true
 *         correo:
 *           type: string
 *         primer_apellido:
 *           type: string
 *         segundo_apellido:
 *           type: string
 *           nullable: true
 *
 *     UsuarioListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Usuario'
 */
