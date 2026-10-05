import { UbicacionGeograficaMapper } from "../../../domain/ubicacionGeografica/mappers/ubicacionGeografica.mapper.js";

function parsePoligono(poligono) {
  if (poligono === undefined || poligono === null) return null;

  // Si ya viene como objeto/array, lo dejamos (JSONB real)
  if (typeof poligono === "object") return poligono;

  // Si viene como string (típico desde Postman con "raw JSON"),
  // intentamos parsearlo
  try {
    return JSON.parse(poligono);
  } catch {
    return null;
  }
}

function mapUbicacionGeograficaRequest(body) {
  return {
    id_zona: body.id_zona,
    id_motordet: body.id_motordet ?? null,
    latitud: body.latitud,
    longitud: body.longitud,
    altitud: body.altitud ?? null,
    poligono_geografico: parsePoligono(body.poligono_geografico),
  };
}

export class UbicacionGeograficaController {
  constructor(ubicacionGeograficaService) {
    this.ubicacionGeograficaService = ubicacionGeograficaService;
  }

  create = async (req, res) => {
    try {
      const data = mapUbicacionGeograficaRequest(req.body);
      const result = await this.ubicacionGeograficaService.create(data);
      res.status(201).json({
        success: true,
        data: UbicacionGeograficaMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const ubicaciones = await this.ubicacionGeograficaService.getAll();
      res.json({
        success: true,
        data: UbicacionGeograficaMapper.toResponseDTOArray(ubicaciones),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const ubicacion = await this.ubicacionGeograficaService.getById(req.params.id);
      res.json({
        success: true,
        data: UbicacionGeograficaMapper.toResponseDTO(ubicacion),
      });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const data = mapUbicacionGeograficaRequest(req.body);
      const result = await this.ubicacionGeograficaService.update(req.params.id, data);
      res.json({
        success: true,
        data: UbicacionGeograficaMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  remove = async (req, res) => {
    try {
      const ubicacion = await this.ubicacionGeograficaService.delete(req.params.id);
      res.json({
        success: true,
        data: UbicacionGeograficaMapper.toResponseDTO(ubicacion),
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}