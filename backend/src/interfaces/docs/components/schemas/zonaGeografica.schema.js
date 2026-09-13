/**
 * @openapi
 * components:
 *   schemas:
 *     ZonaGeografica:
 *       type: object
 *       properties:
 *         id_zona:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Zona Sur
 *         departamento:
 *           type: string
 *           example: La Paz
 *         municipio:
 *           type: string
 *           example: La Paz
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: Zona residencial de alta densidad
 *         estado:
 *           type: string
 *           nullable: true
 *           example: activa
 *         densidad_poblacional:
 *           type: number
 *           nullable: true
 *           example: 1250.5
 *
 *     CreateZonaGeografica:
 *       type: object
 *       required:
 *         - nombre
 *         - departamento
 *         - municipio
 *       properties:
 *         nombre:
 *           type: string
 *           example: Zona Sur
 *         departamento:
 *           type: string
 *           example: La Paz
 *         municipio:
 *           type: string
 *           example: La Paz
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: string
 *           nullable: true
 *         densidad_poblacional:
 *           type: number
 *           nullable: true
 *
 *     UpdateZonaGeografica:
 *       type: object
 *       required:
 *         - nombre
 *         - departamento
 *         - municipio
 *       properties:
 *         nombre:
 *           type: string
 *         departamento:
 *           type: string
 *         municipio:
 *           type: string
 *         descripcion:
 *           type: string
 *           nullable: true
 *         estado:
 *           type: string
 *           nullable: true
 *         densidad_poblacional:
 *           type: number
 *           nullable: true
 *
 *     ZonaGeograficaListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/ZonaGeografica'
 */
