import { AuditoriaMapper } from "../../../domain/auditoria/mappers/auditoria.mapper.js";

export class AuditoriaController {
  constructor(auditoriaService) {
    this.auditoriaService = auditoriaService;
  }

  list = async (req, res) => {
    try {
      const { evento, desde, hasta } = req.query;
      const filas = await this.auditoriaService.getAll({ evento, desde, hasta });
      res.json({ success: true, data: AuditoriaMapper.toResponseDTOArray(filas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  listUsuario = async (req, res) => {
    try {
      const { id_usuario, accion, desde, hasta } = req.query;
      const filas = await this.auditoriaService.getAllUsuario({ id_usuario, accion, desde, hasta });
      res.json({ success: true, data: AuditoriaMapper.toResponseUDTOArray(filas) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
