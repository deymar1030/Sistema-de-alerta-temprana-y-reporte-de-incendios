import { InstitucionMapper } from "../../../domain/institucion/mappers/institucion.mapper.js";

function mapInstitucionCreateRequest(body) {
  return {
    categoria: body.categoria,
    detalle: body.detalle ?? null,
    nombre: body.nombre,
    razon_social: body.razon_social ?? null,
    direccion: body.direccion ?? null,
    telefono_ins: body.telefono_ins ?? null,
    latitud: body.latitud ?? null,
    longitud: body.longitud ?? null,
  };
}

function mapInstitucionUpdateRequest(body) {
  const campos = [
    "categoria",
    "detalle",
    "nombre",
    "razon_social",
    "direccion",
    "telefono_ins",
    "latitud",
    "longitud",
    "estado",
    "disponibilidad_operativa",
  ];

  const data = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) data[campo] = body[campo];
  }

  return data;
}

export class InstitucionController {
  constructor(institucionService) {
    this.institucionService = institucionService;
  }

  create = async (req, res) => {
    try {
      const institucionData = mapInstitucionCreateRequest(req.body);

      const result = await this.institucionService.create(institucionData);

      res.status(201).json({
        success: true,
        data: InstitucionMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  list = async (req, res) => {
    try {
      const instituciones = await this.institucionService.getAll({ categoria: req.query.categoria });

      res.json({
        success: true,
        data: InstitucionMapper.toResponseDTOArray(instituciones),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  getById = async (req, res) => {
    try {
      const institucion = await this.institucionService.getById(req.params.id);

      res.json({
        success: true,
        data: InstitucionMapper.toResponseDTO(institucion),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  update = async (req, res) => {
    try {
      const institucionData = mapInstitucionUpdateRequest(req.body);

      const result = await this.institucionService.update(req.params.id, institucionData);

      res.json({
        success: true,
        data: InstitucionMapper.toResponseDTO(result),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  remove = async (req, res) => {
    try {
      const institucion = await this.institucionService.delete(req.params.id);

      res.json({
        success: true,
        data: InstitucionMapper.toResponseDTO(institucion),
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

}
