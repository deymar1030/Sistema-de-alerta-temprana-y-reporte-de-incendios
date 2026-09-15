/**
 * @openapi
 * /sensores:
 *   get:
 *     tags:
 *       - Sensor
 *     summary: Lista todos los sensores
 *     description: Retorna la lista completa de sensores registrados.
 *     responses:
 *       200:
 *         description: Lista de sensores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorListResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               error: "Error al obtener los sensores"
 */
