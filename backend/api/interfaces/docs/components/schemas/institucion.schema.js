/**
 * @openapi
 * components:
 *   schemas:
 *     Institucion:
 *       type: object
 *       properties:
 *         id_institucion:
 *           type: integer
 *           example: 1
 *         categoria:
 *           type: string
 *           example: "Bomberos"
 *         detalle:
 *           type: string
 *           nullable: true
 *           example: "Unidad especializada en incendios forestales"
 *         nombre:
 *           type: string
 *           example: "Cuerpo de Bomberos Santa Cruz"
 *         razon_social:
 *           type: string
 *           nullable: true
 *           example: "Cuerpo de Bomberos Santa Cruz S.A."
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *           example: "+591 3 3334455"
 *
 *     CreateInstitucion:
 *       type: object
 *       required:
 *         - categoria
 *         - nombre
 *       properties:
 *         categoria:
 *           type: string
 *           example: "Bomberos"
 *         detalle:
 *           type: string
 *           nullable: true
 *           example: "Unidad especializada en incendios forestales"
 *         nombre:
 *           type: string
 *           example: "Cuerpo de Bomberos Santa Cruz"
 *         razon_social:
 *           type: string
 *           nullable: true
 *           example: "Cuerpo de Bomberos Santa Cruz S.A."
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *           example: "+591 3 3334455"
 *
 *     UpdateInstitucion:
 *       type: object
 *       required:
 *         - categoria
 *         - nombre
 *       properties:
 *         categoria:
 *           type: string
 *           example: "Bomberos"
 *         detalle:
 *           type: string
 *           nullable: true
 *           example: "Unidad especializada en incendios forestales"
 *         nombre:
 *           type: string
 *           example: "Cuerpo de Bomberos Santa Cruz"
 *         razon_social:
 *           type: string
 *           nullable: true
 *           example: "Cuerpo de Bomberos Santa Cruz S.A."
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *           example: "+591 3 3334455"
 *
 *     InstitucionListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Institucion'
 */
