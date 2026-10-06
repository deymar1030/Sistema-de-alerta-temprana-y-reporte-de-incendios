import { AlertaMapper } from "../../../domain/alerta/mappers/alerta.mapper.js";

export class AlertaController {
  constructor(alertaService) {
    this.alertaService = alertaService;
  }

  list = async (req, res) => {
    try {
      const alertas = await this.alertaService.getAll(req.query);

      res.json({
        success: true,
        data: AlertaMapper.toResponseDTOArray(alertas),
      });
    } catch (error) {
      const status = error.message.startsWith("Validation errors:")
        ? 400
        : 500;

      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  getActivas = async (req, res) => {
    try {
      const alertas = await this.alertaService.getActivas();

      res.json({
        success: true,
        data: AlertaMapper.toResponseDTOArray(alertas),
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
      const alerta = await this.alertaService.getById(req.params.id);

      res.json({
        success: true,
        data: AlertaMapper.toResponseDTO(alerta),
      });
    } catch (error) {
      const status =
        error.message === "Alerta not found" ? 404 : 400;

      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  marcarRecibido = async (req, res) => {
    try {
      const result = await this.alertaService.marcarRecibido(
        req.params.id,
        req.params.id_institucion
      );

      res.json({
        success: true,
        data: AlertaMapper.envioToResponseDTO(result),
      });
    } catch (error) {
      const status =
        error.message === "Envio not found" ? 404 : 400;

      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  marcarAtendido = async (req, res) => {
    try {
      const result = await this.alertaService.marcarAtendido(
        req.params.id,
        req.params.id_institucion
      );

      res.json({
        success: true,
        data: AlertaMapper.envioToResponseDTO(result),
      });
    } catch (error) {
      const status =
        error.message === "Envio not found" ? 404 : 400;

      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };

  cerrar = async (req, res) => {
    try {
      const result = await this.alertaService.cerrar(
        req.params.id,
        req.params.id_institucion
      );

      res.json({
        success: true,
        data: AlertaMapper.envioToResponseDTO(result),
      });
    } catch (error) {
      const status =
        error.message === "Envio not found" ? 404 : 400;

      res.status(status).json({
        success: false,
        error: error.message,
      });
    }
  };
}