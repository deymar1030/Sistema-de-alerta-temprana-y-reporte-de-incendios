import { InstitucionMapper } from "../../../domain/institucion/mappers/institucion.mapper.js";

function mapInstitucionRequest(body) {
  return {
    categoria: body.categoria,
    detalle: body.detalle ?? null,
    nombre: body.nombre,
    razon_social: body.razon_social ?? null,
    telefono_ins: body.telefono_ins ?? null,
  };
}

export class InstitucionController {
  constructor(institucionService) {
    this.institucionService = institucionService;
  }

  create = async (req, res) => {
    try {
      const institucionData = mapInstitucionRequest(req.body);

      const result =
        await this.institucionService.create(institucionData);

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
      const instituciones =
        await this.institucionService.getAll();

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
      const institucion =
        await this.institucionService.getById(req.params.id);

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
      const institucionData = mapInstitucionRequest(req.body);

      const result =
        await this.institucionService.update(
          req.params.id,
          institucionData
        );

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
      const institucion =
        await this.institucionService.delete(req.params.id);

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