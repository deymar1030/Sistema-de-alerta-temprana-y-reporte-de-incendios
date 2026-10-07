/**
 * @openapi
 * /instituciones/{id}/jurisdicciones:
 *   post:
 *     tags:
 *       - Institucion
 *     summary: Vincula una zona geográfica a la jurisdicción de una institución
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddJurisdiccion'
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       201:
 *         description: Jurisdicción vinculada exitosamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 id_zona: 1
 *                 id_institucion: 1
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
