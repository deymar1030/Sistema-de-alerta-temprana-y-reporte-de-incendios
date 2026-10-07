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
 *           enum: [BOMBEROS, POLICIA, DEFENSA_CIVIL, RESCATE, OTRA]
 *           example: "BOMBEROS"
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
 *         direccion:
 *           type: string
 *           nullable: true
 *           example: "Av. Siempre Viva 123"
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *           example: "+591 3 3334455"
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -16.5
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -68.15
 *         estado:
 *           type: boolean
 *           example: true
 *         disponibilidad_operativa:
 *           type: string
 *           nullable: true
 *           example: "DISPONIBLE"
 *
 *     CreateInstitucion:
 *       type: object
 *       required:
 *         - categoria
 *         - nombre
 *       properties:
 *         categoria:
 *           type: string
 *           enum: [BOMBEROS, POLICIA, DEFENSA_CIVIL, RESCATE, OTRA]
 *           example: "BOMBEROS"
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
 *         direccion:
 *           type: string
 *           nullable: true
 *           example: "Av. Siempre Viva 123"
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *           example: "+591 3 3334455"
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -16.5
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -68.15
 *
 *     UpdateInstitucion:
 *       type: object
 *       description: Todos los campos son opcionales; solo se actualizan los que se envíen.
 *       properties:
 *         categoria:
 *           type: string
 *           enum: [BOMBEROS, POLICIA, DEFENSA_CIVIL, RESCATE, OTRA]
 *         detalle:
 *           type: string
 *           nullable: true
 *         nombre:
 *           type: string
 *         razon_social:
 *           type: string
 *           nullable: true
 *         direccion:
 *           type: string
 *           nullable: true
 *         telefono_ins:
 *           type: string
 *           nullable: true
 *         latitud:
 *           type: number
 *           nullable: true
 *         longitud:
 *           type: number
 *           nullable: true
 *         estado:
 *           type: boolean
 *         disponibilidad_operativa:
 *           type: string
 *           nullable: true
 *           example: "DISPONIBLE"
 *
 *     InstitucionListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Institucion'
 *
 *     AddJurisdiccion:
 *       type: object
 *       required:
 *         - id_zona
 *       properties:
 *         id_zona:
 *           type: integer
 *           example: 1
 */
