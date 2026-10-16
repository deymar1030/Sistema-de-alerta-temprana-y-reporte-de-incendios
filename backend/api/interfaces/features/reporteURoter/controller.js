import { ReporteUMapper } from "../../../domain/reporteU/mappers/reporteU.mapper.js";

function mapReporteURequest(body) {
  return {
    id_usuario: body.id_usuario,
    descripcion: body.descripcion,
    tipo: body.tipo ?? null,
    nivel_prioridad: body.nivel_prioridad ?? null,
    latitud: body.latitud ?? null,
    longitud: body.longitud ?? null,
    indicador: body.indicador ?? null,
    foto_url: body.foto_url ?? null,
  };
}

export class ReporteUController {
  constructor(reporteUService) {
    this.reporteUService = reporteUService;
  }

  create = async (req, res) => {
    try {
      const reporteUData = mapReporteURequest(req.body);
      const result = await this.reporteUService.create(reporteUData);
      res.status(201).json({ success: true, data: ReporteUMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const { id_usuario, nivel_prioridad, estado, desde, hasta } = req.query;
      const reportes = await this.reporteUService.getAll({ id_usuario, nivel_prioridad, estado, desde, hasta });
      res.json({ success: true, data: ReporteUMapper.toResponseDTOArray(reportes) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { reporteU, alerta_vinculada } = await this.reporteUService.getById(req.params.id);
      res.json({ success: true, data: ReporteUMapper.toResponseDTO(reporteU, alerta_vinculada) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  updateEstado = async (req, res) => {
    try {
      const result = await this.reporteUService.updateEstado(req.params.id, { estado: req.body.estado });
      res.json({ success: true, data: { id_reporte_u: result.id_reporte_u, estado: result.estado } });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  vincularAlerta = async (req, res) => {
    try {
      const result = await this.reporteUService.vincularAlerta(req.params.id, { id_alerta: req.body.id_alerta });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
