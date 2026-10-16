/**
 * @openapi
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: sid
 *       description: >
 *         Cookie de sesión httpOnly emitida por POST /auth/login. Swagger UI
 *         no permite fijar cookies httpOnly manualmente: para probar estos
 *         endpoints inicia sesión primero desde el navegador (mismo origen)
 *         y luego ejecuta el resto de peticiones desde /docs, o usa una
 *         herramienta como curl/Postman conservando la cookie "sid".
 */
