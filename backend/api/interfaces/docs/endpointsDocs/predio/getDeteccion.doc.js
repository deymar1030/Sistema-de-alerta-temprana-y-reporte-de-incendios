/**
 * @openapi
 * /predios/{id}/deteccion:
 *   get:
 *     tags: [Predios]
 *     summary: Estado actual del motor y lecturas recientes de un predio
 *     description: Consulta de solo lectura. Puntaje null significa datos o tiempo insuficientes. No genera alertas. Requiere cookie de sesion.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success/data con id_predio, nombre, activo, actualizado_en, motor, configuracion, alerta, evaluacion y sensores.
 *       400:
 *         description: ID invalido
 *       401:
 *         description: Sesion requerida
 *       404:
 *         description: Predio no encontrado
 *       503:
 *         description: Estado del motor no disponible
 */
