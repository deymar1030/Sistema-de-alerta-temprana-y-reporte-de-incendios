import { ZonaGeograficaMapper } from "../../../domain/zonaGeografica/mappers/zonaGeografica.mapper.js";

function mapZonaGeograficaRequest(body) {
  return {
    nombre: body.nombre,
    departamento: body.departamento,
    municipio: body.municipio,
    descripcion: body.descripcion ?? null,
    estado: body.estado ?? null,
    densidad_poblacional: body.densidad_poblacional ?? null,
  };
}

export class ZonaGeograficaController {
  constructor(zonaGeograficaService) {
    this.zonaGeograficaService = zonaGeograficaService;
  }

  create = async (req, res) => {
    try {
      const zonaGeograficaData = mapZonaGeograficaRequest(req.body);
      const result = await this.zonaGeograficaService.create(zonaGeograficaData);
      res.status(201).json({ success: true, data: ZonaGeograficaMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const zonas = await this.zonaGeograficaService.getAll();
      res.json({ success: true, data: ZonaGeograficaMapper.toResponseDTOArray(zonas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const zona = await this.zonaGeograficaService.getById(req.params.id);
      res.json({ success: true, data: ZonaGeograficaMapper.toResponseDTO(zona) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const zonaGeograficaData = mapZonaGeograficaRequest(req.body);
      const result = await this.zonaGeograficaService.update(req.params.id, zonaGeograficaData);
      res.json({ success: true, data: ZonaGeograficaMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  remove = async (req, res) => {
    try {
      const zona = await this.zonaGeograficaService.delete(req.params.id);
      res.json({ success: true, data: ZonaGeograficaMapper.toResponseDTO(zona) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
