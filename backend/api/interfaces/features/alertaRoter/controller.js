import { AlertaMapper } from "../../../domain/alerta/mappers/alerta.mapper.js";
import { LecturaMapper } from "../../../domain/lectura/mappers/lectura.mapper.js";
import { PredioMapper } from "../../../domain/predio/mappers/predio.mapper.js";
import { ResponseInstitucionNotificadaDTO, ResponseEnvioDTO } from "../../../domain/envia/dtos/responseEnvia.dto.js";
import { ReporteUMapper } from "../../../domain/reporteU/mappers/reporteU.mapper.js";
import { alcanceAlertas } from "../../../domain/alerta/visibilidadAlerta.js";

export class AlertaController {
  constructor(alertaService) {
    this.alertaService = alertaService;
  }

  autorizarInstitucion(req, res) {
    const usuario = req.auth?.usuario;
    if (!usuario?.id_institucion || String(usuario.id_institucion) !== String(req.params.id_institucion) ||
        !['JEFE_INSTITUCION', 'OPERATIVO'].includes(usuario.rol?.nombre_rol)) {
      res.status(403).json({ success: false, error: 'Solo personal de la institucion destinataria puede gestionar el envio' });
      return false;
    }
    return true;
  }

  // Lo que el usuario puede ver segun su rol pisa lo que pida por query: un
  // jefe solo ve su institucion y un ciudadano solo alertas validadas, aunque
  // pida otra cosa (ver visibilidadAlerta.js).
  filtrosConAlcance(req, filtros) {
    const alcance = alcanceAlertas(req.auth?.usuario);
    return {
      ...filtros,
      id_institucion: alcance.id_institucion ?? filtros.id_institucion,
      estados: alcance.estados,
    };
  }

  puedeVerAlerta(req, alerta, instituciones_notificadas) {
    const alcance = alcanceAlertas(req.auth?.usuario);
    if (alcance.completo) return true;
    if (alcance.id_institucion) return instituciones_notificadas.some((e) => String(e.id_institucion) === alcance.id_institucion);
    return alcance.estados.includes(alerta.estado);
  }

  list = async (req, res) => {
    try {
      const alertas = await this.alertaService.getAll(this.filtrosConAlcance(req, {
        estado: req.query.estado,
        clasificacion: req.query.clasificacion,
        id_zona: req.query.id_zona,
        id_institucion: req.query.id_institucion,
        desde: req.query.desde,
        hasta: req.query.hasta,
      }));
      res.json({ success: true, data: AlertaMapper.toResponseDTOArray(alertas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  activas = async (req, res) => {
    try {
      const alertas = await this.alertaService.getActivas(this.filtrosConAlcance(req, {
        clasificacion: req.query.clasificacion,
        id_zona: req.query.id_zona,
        id_institucion: req.query.id_institucion,
        desde: req.query.desde,
        hasta: req.query.hasta,
      }));
      res.json({ success: true, data: AlertaMapper.toResponseDTOArray(alertas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  mapa = async (req, res) => {
    try {
      const alertas = await this.alertaService.getMapa(this.filtrosConAlcance(req, {
        clasificacion: req.query.clasificacion,
        id_zona: req.query.id_zona,
        id_institucion: req.query.id_institucion,
      }));
      res.json({ success: true, data: AlertaMapper.toMapaDTOArray(alertas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const { alerta, predio, lecturas, instituciones_notificadas, reporte_origen } =
        await this.alertaService.getById(req.params.id);
      // 404 y no 403: no se confirma que exista una alerta que no le corresponde ver.
      if (!this.puedeVerAlerta(req, alerta, instituciones_notificadas)) {
        return res.status(404).json({ success: false, error: "Alerta not found" });
      }

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
    if (!this.autorizarInstitucion(req, res)) return;
    try {
      const envio = await this.alertaService.recibir(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  atender = async (req, res) => {
    if (!this.autorizarInstitucion(req, res)) return;
    try {
      const envio = await this.alertaService.atender(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  cerrar = async (req, res) => {
    if (!this.autorizarInstitucion(req, res)) return;
    try {
      const envio = await this.alertaService.cerrar(req.params.id, req.params.id_institucion);
      res.json({ success: true, data: ResponseEnvioDTO.fromEntity(envio) });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
