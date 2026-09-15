/**
 * @openapi
 * /sensores:
 *   post:
 *     tags:
 *       - Sensor
 *     summary: Crea un nuevo sensor
 *     description: Registra un nuevo sensor asociado a una ubicación geográfica.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSensor'
 *     responses:
 *       201:
 *         description: Sensor creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             example:
 *               error: "Todos los campos del sensor son obligatorios"
 */
