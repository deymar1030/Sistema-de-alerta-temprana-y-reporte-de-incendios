import { AlertaMapper } from "../../../domain/alerta/mappers/alerta.mapper.js";
import { LecturaMapper } from "../../../domain/lectura/mappers/lectura.mapper.js";
import { PredioMapper } from "../../../domain/predio/mappers/predio.mapper.js";
import { ResponseInstitucionNotificadaDTO, ResponseEnvioDTO } from "../../../domain/envia/dtos/responseEnvia.dto.js";
import { ReporteUMapper } from "../../../domain/reporteU/mappers/reporteU.mapper.js";

export class AlertaController {
  constructor(alertaService) {
    this.alertaService = alertaService;
  }

  list = async (req, res) => {
    try {
      const alertas = await this.alertaService.getAll({
        estado: req.query.estado,
        clasificacion: req.query.clasificacion,
        id_zona: req.query.id_zona,
        id_institucion: req.query.id_institucion,
        desde: req.query.desde,
        hasta: req.query.hasta,
      });
      res.json({ success: true, data: AlertaMapper.toResponseDTOArray(alertas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  activas = async (req, res) => {
    try {
      const alertas = await this.alertaService.getActivas({
        clasificacion: req.query.clasificacion,
        id_zona: req.query.id_zona,
        id_institucion: req.query.id_institucion,
        desde: req.query.desde,
        hasta: req.query.hasta,
      });
      res.json({ success: true, data: AlertaMapper.toResponseDTOArray(alertas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { alerta, predio, lecturas, instituciones_notificadas, reporte_origen } =
        await this.alertaService.getById(req.params.id);

      res.json({
        success: true,
        data: AlertaMapper.toDetalleDTO(alerta, {
          predio: predio ? PredioMapper.toMapaDTO(predio) : null,
          lecturas: LecturaMapper.toResponseDTOArray(lecturas),
          instituciones_notificadas: instituciones_notificadas.map((envia) =>
            ResponseInstitucionNotificadaDTO.fromEntity(envia)
          ),
          reporte_origen: reporte_origen ? ReporteUMapper.toResponseDTO(reporte_origen) : null,
        }),
      });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  recibir = async (req, res) => {
    try {
      const envio = await this.alertaService.recibir(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  atender = async (req, res) => {
    try {
      const envio = await this.alertaService.atender(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  cerrar = async (req, res) => {
    try {
      const envio = await this.alertaService.cerrar(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
