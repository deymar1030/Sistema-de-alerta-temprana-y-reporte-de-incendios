/**
 * @openapi
 * components:
 *   schemas:
 *     Sesion:
 *       type: object
 *       description: >
 *         Nunca incluye el token de sesión: solo lo necesario para que el
 *         usuario reconozca y administre sus sesiones activas.
 *       properties:
 *         id_sesion:
 *           type: integer
 *           example: 1
 *         dispositivo:
 *           type: string
 *           nullable: true
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 *         ip_origen:
 *           type: string
 *           nullable: true
 *           example: "190.129.10.20"
 *         creada_en:
 *           type: string
 *           format: date-time
 *         ultima_actividad:
 *           type: string
 *           format: date-time
 *         expira_en:
 *           type: string
 *           format: date-time
 *         actual:
 *           type: boolean
 *           description: Indica si esta es la sesión usada para autenticar la petición actual.
 *           example: true
 *
 *     SesionListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Sesion'
 */
