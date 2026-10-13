import { MotorDetMapper } from "../../../domain/motorDet/mappers/motorDet.mapper.js";

export class MotorDetController {
  constructor(motorDetService) {
    this.motorDetService = motorDetService;
  }

  list = async (req, res) => {
    try {
      const motores = await this.motorDetService.getAll();
      res.json({ success: true, data: MotorDetMapper.toResponseDTOArray(motores) });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const motor = await this.motorDetService.getById(req.params.id);
      res.json({ success: true, data: MotorDetMapper.toResponseDTO(motor) });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };
}
