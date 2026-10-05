/**
 * @openapi
 * components:
 *   schemas:
 *     UbicacionGeografica:
 *       type: object
 *       properties:
 *         id_ubic_geo:
 *           type: integer
 *           example: 1
 *         id_zona:
 *           type: integer
 *           example: 1
 *         id_motordet:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -17.7833
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -63.1821
 *         altitud:
 *           type: number
 *           nullable: true
 *           example: 416
 *         poligono_geografico:
 *           type: array
 *           nullable: true
 *           items:
 *             type: array
 *             items:
 *               type: number
 *           example: [[-17.78, -63.18], [-17.79, -63.19]]
 *
 *     CreateUbicacionGeografica:
 *       type: object
 *       required:
 *         - id_zona
 *         - latitud
 *         - longitud
 *       properties:
 *         id_zona:
 *           type: integer
 *           example: 1
 *         id_motordet:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         latitud:
 *           type: number
 *           example: -17.7833
 *         longitud:
 *           type: number
 *           example: -63.1821
 *         altitud:
 *           type: number
 *           nullable: true
 *           example: 416
 *         poligono_geografico:
 *           type: array
 *           nullable: true
 *           items:
 *             type: array
 *             items:
 *               type: number
 *           example: [[-17.78, -63.18], [-17.79, -63.19]]
 *
 *     UpdateUbicacionGeografica:
 *       type: object
 *       properties:
 *         id_zona:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         id_motordet:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -17.8000
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -63.1900
 *         altitud:
 *           type: number
 *           nullable: true
 *           example: 420
 *         poligono_geografico:
 *           type: array
 *           nullable: true
 *           items:
 *             type: array
 *             items:
 *               type: number
 *           example: [[-17.80, -63.20]]
 *
 *     UbicacionGeograficaListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/UbicacionGeografica'
 */