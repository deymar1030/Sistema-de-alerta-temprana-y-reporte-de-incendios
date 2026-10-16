/**
 * @openapi
 * components:
 *   schemas:
 *     InformeAtencion:
 *       type: object
 *       properties:
 *         id_informe_atencion:
 *           type: integer
 *           example: 4
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         id_institucion:
 *           type: integer
 *           example: 3
 *         id_usuario:
 *           type: integer
 *           example: 45
 *         estado:
 *           type: string
 *           enum: [BORRADOR, COMPLETADO]
 *           example: "COMPLETADO"
 *         fecha_incidente:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: "2026-10-02"
 *         hora_recepcion:
 *           type: string
 *           nullable: true
 *           example: "18:12:31"
 *         hora_salida:
 *           type: string
 *           nullable: true
 *           example: "18:15:00"
 *         hora_llegada:
 *           type: string
 *           nullable: true
 *           example: "18:25:00"
 *         hora_control:
 *           type: string
 *           nullable: true
 *           example: "19:10:00"
 *         hora_finalizacion:
 *           type: string
 *           nullable: true
 *           example: "19:40:00"
 *         personal:
 *           type: integer
 *           nullable: true
 *           example: 8
 *         vehiculos:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         personas_afectadas:
 *           type: integer
 *           nullable: true
 *           example: 3
 *         personas_evacuadas:
 *           type: integer
 *           nullable: true
 *           example: 12
 *         heridos:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         fallecidos:
 *           type: integer
 *           nullable: true
 *           example: 0
 *         danos_materiales:
 *           type: string
 *           nullable: true
 *           example: "Pérdida parcial de mercadería en 2 puestos"
 *         causa:
 *           type: string
 *           nullable: true
 *           example: "Cortocircuito en instalación eléctrica"
 *         acciones:
 *           type: string
 *           nullable: true
 *           example: "Evacuación y control del foco en 45 minutos"
 *         observaciones:
 *           type: string
 *           nullable: true
 *           example: "Apoyo de Defensa Civil en el perímetro"
 *         recomendaciones:
 *           type: string
 *           nullable: true
 *           example: "Revisar instalación eléctrica del predio"
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *
 *     CreateInformeAtencion:
 *       type: object
 *       required:
 *         - id_alerta
 *         - id_institucion
 *         - id_usuario
 *       properties:
 *         id_alerta:
 *           type: integer
 *           example: 7
 *         id_institucion:
 *           type: integer
 *           example: 3
 *         id_usuario:
 *           type: integer
 *           example: 45
 *         estado:
 *           type: string
 *           enum: [BORRADOR, COMPLETADO]
 *           default: "BORRADOR"
 *         fecha_incidente:
 *           type: string
 *           format: date
 *           nullable: true
 *         hora_recepcion:
 *           type: string
 *           nullable: true
 *           example: "18:12:31"
 *         personal:
 *           type: integer
 *           nullable: true
 *         vehiculos:
 *           type: integer
 *           nullable: true
 *         personas_afectadas:
 *           type: integer
 *           nullable: true
 *         personas_evacuadas:
 *           type: integer
 *           nullable: true
 *         heridos:
 *           type: integer
 *           nullable: true
 *         fallecidos:
 *           type: integer
 *           nullable: true
 *         danos_materiales:
 *           type: string
 *           nullable: true
 *         causa:
 *           type: string
 *           nullable: true
 *         acciones:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         recomendaciones:
 *           type: string
 *           nullable: true
 *
 *     UpdateInformeAtencion:
 *       type: object
 *       description: Todos los campos son opcionales; solo se actualizan los que se envíen.
 *       properties:
 *         estado:
 *           type: string
 *           enum: [BORRADOR, COMPLETADO]
 *         fecha_incidente:
 *           type: string
 *           format: date
 *           nullable: true
 *         hora_recepcion:
 *           type: string
 *           nullable: true
 *         hora_salida:
 *           type: string
 *           nullable: true
 *         hora_llegada:
 *           type: string
 *           nullable: true
 *         hora_control:
 *           type: string
 *           nullable: true
 *         hora_finalizacion:
 *           type: string
 *           nullable: true
 *         personal:
 *           type: integer
 *           nullable: true
 *         vehiculos:
 *           type: integer
 *           nullable: true
 *         personas_afectadas:
 *           type: integer
 *           nullable: true
 *         personas_evacuadas:
 *           type: integer
 *           nullable: true
 *         heridos:
 *           type: integer
 *           nullable: true
 *         fallecidos:
 *           type: integer
 *           nullable: true
 *         danos_materiales:
 *           type: string
 *           nullable: true
 *         causa:
 *           type: string
 *           nullable: true
 *         acciones:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         recomendaciones:
 *           type: string
 *           nullable: true
 *
 *     InformeAtencionListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/InformeAtencion'
 */
