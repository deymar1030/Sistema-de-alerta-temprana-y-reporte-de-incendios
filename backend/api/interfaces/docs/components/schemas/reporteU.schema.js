/**
 * @openapi
 * components:
 *   schemas:
 *     AlertaVinculada:
 *       type: object
 *       nullable: true
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         estado:
 *           type: string
 *           example: "EN_EVALUACION"
 *
 *     ReporteU:
 *       type: object
 *       properties:
 *         id_reporte_u:
 *           type: integer
 *           example: 15
 *         id_usuario:
 *           type: integer
 *           example: 90
 *         descripcion:
 *           type: string
 *           example: "Se ve humo denso saliendo del segundo piso"
 *         tipo:
 *           type: string
 *           nullable: true
 *           example: "VIVIENDA"
 *         nivel_prioridad:
 *           type: string
 *           nullable: true
 *           enum: [BAJA, MEDIA, ALTA]
 *           example: "ALTA"
 *         estado:
 *           type: string
 *           enum: [RECIBIDO, EN_REVISION, VALIDADO, DESCARTADO, ATENDIDO]
 *           example: "RECIBIDO"
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *           example: "2026-10-02T18:05:00Z"
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -16.501
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -68.132
 *         indicador:
 *           type: string
 *           nullable: true
 *           example: "humo_visible,personas_en_riesgo"
 *         foto_url:
 *           type: string
 *           nullable: true
 *           example: "/api/archivos/reportes-usuario/3fa85f64....jpg"
 *         alerta_vinculada:
 *           $ref: '#/components/schemas/AlertaVinculada'
 *
 *     CreateReporteU:
 *       type: object
 *       required:
 *         - id_usuario
 *         - descripcion
 *       properties:
 *         id_usuario:
 *           type: integer
 *           example: 90
 *         descripcion:
 *           type: string
 *           example: "Se ve humo denso saliendo del segundo piso"
 *         tipo:
 *           type: string
 *           nullable: true
 *           example: "VIVIENDA"
 *         nivel_prioridad:
 *           type: string
 *           nullable: true
 *           enum: [BAJA, MEDIA, ALTA]
 *           example: "ALTA"
 *         latitud:
 *           type: number
 *           nullable: true
 *           example: -16.501
 *         longitud:
 *           type: number
 *           nullable: true
 *           example: -68.132
 *         indicador:
 *           type: string
 *           nullable: true
 *           example: "humo_visible,personas_en_riesgo"
 *         foto_url:
 *           type: string
 *           nullable: true
 *           example: "/api/archivos/reportes-usuario/3fa85f64....jpg"
 *
 *     UpdateEstadoReporteU:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           enum: [RECIBIDO, EN_REVISION, VALIDADO, DESCARTADO, ATENDIDO]
 *           example: "VALIDADO"
 *
 *     VincularAlertaReporteU:
 *       type: object
 *       required:
 *         - id_alerta
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *
 *     ReporteUListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/ReporteU'
 */
