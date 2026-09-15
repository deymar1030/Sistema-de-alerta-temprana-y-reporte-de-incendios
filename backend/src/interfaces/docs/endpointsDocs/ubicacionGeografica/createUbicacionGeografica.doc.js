/**
 * @openapi
 * /ubicaciones-geograficas:
 *   post:
 *     tags:
 *       - UbicacionGeografica
 *     summary: Crea una nueva ubicación geográfica
 *     description: Registra una nueva ubicación geográfica en el sistema.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUbicacionGeografica'
 *     responses:
 *       201:
 *         description: Ubicación geográfica creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UbicacionGeografica'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "id_zona es obligatorio, latitud es obligatoria"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Error al crear la ubicación geográfica"
 */