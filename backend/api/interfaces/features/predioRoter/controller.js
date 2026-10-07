import { PredioMapper } from "../../../domain/predio/mappers/predio.mapper.js";

function mapPredioCreateRequest(body) {
  return {
    id_zona: body.id_zona,
    id_motordet: body.id_motordet,
    tipo_predio: body.tipo_predio,
    nombre: body.nombre,
    direccion: body.direccion,
    latitud: body.latitud,
    longitud: body.longitud,
    fecha_evaluacion: body.fecha_evaluacion ?? null,
    estado_electrico: body.estado_electrico ?? null,
    estado_gas: body.estado_gas ?? null,
    fuentes_calor: body.fuentes_calor ?? null,
    carga_combustible: body.carga_combustible ?? null,
    material_construccion: body.material_construccion ?? null,
    ocupacion: body.ocupacion ?? null,
    nivel_proteccion: body.nivel_proteccion ?? null,
  };
}

function mapPredioUpdateRequest(body) {
  const campos = [
    "id_zona",
    "id_motordet",
    "tipo_predio",
    "nombre",
    "direccion",
    "latitud",
    "longitud",
    "fecha_evaluacion",
    "estado_electrico",
    "estado_gas",
    "fuentes_calor",
    "carga_combustible",
    "material_construccion",
    "ocupacion",
    "nivel_proteccion",
  ];

  const data = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  return data;
}

export class PredioController {
  constructor(predioService) {
    this.predioService = predioService;
  }

  create = async (req, res) => {
    try {
      const predioData = mapPredioCreateRequest(req.body);
      const result = await this.predioService.create(predioData);
      res.status(201).json({ success: true, data: PredioMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  list = async (req, res) => {
    try {
      const predios = await this.predioService.getAll({
        id_zona: req.query.id_zona,
        tipo_predio: req.query.tipo_predio,
      });
      res.json({ success: true, data: PredioMapper.toResponseDTOArray(predios) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { predio, sensores } = await this.predioService.getById(req.params.id);
      res.json({ success: true, data: PredioMapper.toResponseDTO(predio, sensores) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  mapa = async (req, res) => {
    try {
      const predios = await this.predioService.getMapa();
      res.json({ success: true, data: PredioMapper.toMapaDTOArray(predios) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const predioData = mapPredioUpdateRequest(req.body);
      const result = await this.predioService.update(req.params.id, predioData);
      res.json({ success: true, data: PredioMapper.toResponseDTO(result) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  remove = async (req, res) => {
    try {
      await this.predioService.delete(req.params.id);
      res.json({ success: true, data: null });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
