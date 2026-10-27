/**
 * @openapi
 * /archivos/{carpeta}/{nombre}:
 *   get:
 *     tags:
 *       - Archivo
 *     summary: Sirve una imagen subida previamente
 *     parameters:
 *       - in: path
 *         name: carpeta
 *         required: true
 *         schema:
 *           type: string
 *         example: "reportes-usuario"
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6.jpg"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       200:
 *         description: Binario de la imagen
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Archivo no encontrado
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Archivo no encontrado"
 */
