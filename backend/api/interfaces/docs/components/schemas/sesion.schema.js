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
