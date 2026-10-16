/**
 * @openapi
 * /archivos:
 *   post:
 *     tags:
 *       - Archivo
 *     summary: Sube una imagen
 *     description: Solo acepta jpg, jpeg, png o webp; tamaño máximo 5 MB.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Archivo subido exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 url: "/api/archivos/reportes-usuario/3fa85f64-5717-4562-b3fc-2c963f66afa6.jpg"
 *       400:
 *         description: Archivo inválido (tipo no permitido o tamaño excedido)
 *         content:
 *           application/json:
 *             examples:
 *               tipoInvalido:
 *                 value:
 *                   success: false
 *                   error: "El archivo debe ser jpg, jpeg, png o webp"
 *               tamanoExcedido:
 *                 value:
 *                   success: false
 *                   error: "El archivo no debe superar los 5 MB"
 */
