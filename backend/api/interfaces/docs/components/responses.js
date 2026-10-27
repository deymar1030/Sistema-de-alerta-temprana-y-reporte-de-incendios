/**
 * @openapi
 * components:
 *   responses:
 *     BadRequest:
 *       description: Datos inválidos en la solicitud
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Validation errors: Missing nombre"
 *     NotFound:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Zona geografica not found"
 *     InternalError:
 *       description: Error interno del servidor
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *     Unauthorized:
 *       description: No autenticado, o la sesión no es válida, expiró o fue revocada
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "No autenticado"
 *               code:
 *                 type: string
 *                 example: "UNAUTHENTICATED"
 *     Forbidden:
 *       description: >
 *         Origen no permitido. Protección CSRF: las peticiones que modifican
 *         datos deben originarse desde el propio backend o el frontend
 *         autorizado (CORS_ORIGIN).
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: "Origen no permitido"
 *               code:
 *                 type: string
 *                 example: "FORBIDDEN_ORIGIN"
 */
