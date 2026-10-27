import { InstitucionMapper } from "../../../domain/institucion/mappers/institucion.mapper.js";
import { ZonaGeograficaMapper } from "../../../domain/zonaGeografica/mappers/zonaGeografica.mapper.js";

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

  listJurisdicciones = async (req, res) => {
    try {
      const zonas = await this.institucionService.getJurisdicciones(req.params.id);

      res.json({
        success: true,
        data: ZonaGeograficaMapper.toResponseDTOArray(zonas),
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  addJurisdiccion = async (req, res) => {
    try {
      const vinculo = await this.institucionService.addJurisdiccion(req.params.id, req.body.id_zona);

      res.status(201).json({
        success: true,
        data: { id_zona: vinculo.id_zona, id_institucion: vinculo.id_institucion },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  removeJurisdiccion = async (req, res) => {
    try {
      await this.institucionService.removeJurisdiccion(req.params.id, req.params.id_zona);

      res.json({
        success: true,
        data: null,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };
}
