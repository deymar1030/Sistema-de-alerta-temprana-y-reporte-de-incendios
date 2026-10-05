import { NotificacionMapper } from "../../../domain/notificacion/mappers/notificacion.mapper.js";

export class NotificacionController {
  constructor(notificacionService) {
    this.notificacionService = notificacionService;
  }

  list = async (req, res) => {
    try {
      const { leida, tipo } = req.query;
      const notificaciones = await this.notificacionService.getAll(req.auth.usuario.id_usuario, { leida, tipo });
      res.json({ success: true, data: NotificacionMapper.toResponseDTOArray(notificaciones) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  conteoNoLeidas = async (req, res) => {
    try {
      const total = await this.notificacionService.countNoLeidas(req.auth.usuario.id_usuario);
      res.json({ success: true, data: { total } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  marcarLeida = async (req, res) => {
    try {
      const result = await this.notificacionService.marcarLeida(req.params.id, req.auth.usuario.id_usuario);
      res.json({ success: true, data: { id_notificacion: result.id_notificacion, leida: result.leida } });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  marcarTodasLeidas = async (req, res) => {
    try {
      const actualizadas = await this.notificacionService.marcarTodasLeidas(req.auth.usuario.id_usuario);
      res.json({ success: true, data: { actualizadas } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
