import { InformeAtencionMapper } from "../../../domain/informeAtencion/mappers/informeAtencion.mapper.js";

function mapCreateRequest(body) {
  return {
    id_alerta: body.id_alerta,
    id_institucion: body.id_institucion,
    id_usuario: body.id_usuario,
    estado: body.estado,
    fecha_incidente: body.fecha_incidente,
    hora_recepcion: body.hora_recepcion,
    hora_salida: body.hora_salida,
    hora_llegada: body.hora_llegada,
    hora_control: body.hora_control,
    hora_finalizacion: body.hora_finalizacion,
    personal: body.personal,
    vehiculos: body.vehiculos,
    personas_afectadas: body.personas_afectadas,
    personas_evacuadas: body.personas_evacuadas,
    heridos: body.heridos,
    fallecidos: body.fallecidos,
    danos_materiales: body.danos_materiales,
    causa: body.causa,
    acciones: body.acciones,
    observaciones: body.observaciones,
    recomendaciones: body.recomendaciones,
  };
}

function mapUpdateRequest(body) {
  const campos = [
    "estado",
    "fecha_incidente",
    "hora_recepcion",
    "hora_salida",
    "hora_llegada",
    "hora_control",
    "hora_finalizacion",
    "personal",
    "vehiculos",
    "personas_afectadas",
    "personas_evacuadas",
    "heridos",
    "fallecidos",
    "danos_materiales",
    "causa",
    "acciones",
    "observaciones",
    "recomendaciones",
  ];

  const data = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  return data;
}

export class InformeAtencionController {
  constructor(informeAtencionService) {
    this.informeAtencionService = informeAtencionService;
  }

  create = async (req, res) => {
    try {
      const informeData = mapCreateRequest(req.body);
      const result = await this.informeAtencionService.create(informeData);
      res.status(201).json({ success: true, data: InformeAtencionMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const informes = await this.informeAtencionService.getAll({
        id_institucion: req.query.id_institucion,
        id_alerta: req.query.id_alerta,
        estado: req.query.estado,
      });
      res.json({ success: true, data: InformeAtencionMapper.toResponseDTOArray(informes) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const informe = await this.informeAtencionService.getById(req.params.id);
      res.json({ success: true, data: InformeAtencionMapper.toResponseDTO(informe) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const informeData = mapUpdateRequest(req.body);
      const result = await this.informeAtencionService.update(req.params.id, informeData);
      res.json({ success: true, data: InformeAtencionMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
