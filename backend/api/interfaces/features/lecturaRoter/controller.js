import { LecturaMapper } from "../../../domain/lectura/mappers/lectura.mapper.js";

export class LecturaController {
  constructor(lecturaService) {
    this.lecturaService = lecturaService;
  }

  list = async (req, res) => {
    try {
      const { items, total, page, pageSize } = await this.lecturaService.getAll({
        id_sensor: req.query.id_sensor,
        id_predio: req.query.id_predio,
        tipo_variable: req.query.tipo_variable,
        estado_lectura: req.query.estado_lectura,
        desde: req.query.desde,
        hasta: req.query.hasta,
        page: req.query.page,
        pageSize: req.query.pageSize,
      });

      res.json({
        success: true,
        data: { items: LecturaMapper.toResponseDTOArray(items), total, page, pageSize },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const lectura = await this.lecturaService.getById(req.params.id);
      res.json({ success: true, data: LecturaMapper.toResponseDTO(lectura) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };
}
