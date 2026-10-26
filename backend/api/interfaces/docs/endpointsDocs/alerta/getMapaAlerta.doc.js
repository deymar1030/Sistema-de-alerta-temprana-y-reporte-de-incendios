/**
 * @openapi
 * /alertas/mapa:
 *   get:
 *     tags:
 *       - Alerta
 *     summary: Lista las alertas activas con los datos minimos para ubicarlas en un mapa
 *     description: Misma lista que /alertas/activas pero con las ubicaciones (predio del sensor y/o reporte ciudadano de origen) ya resueltas, para no pedir /alertas/{id} una por una.
 *     parameters:
 *       - in: query
 *         name: clasificacion
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_zona
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_institucion
 *         required: false
 *         schema:
 *           type: integer
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Lista de alertas activas para el mapa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AlertaMapaListResponse'
 */
