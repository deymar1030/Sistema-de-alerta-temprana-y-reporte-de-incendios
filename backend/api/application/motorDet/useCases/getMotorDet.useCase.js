import { GetMotorDetDTO } from "../../../domain/motorDet/dtos/getMotorDet.dto.js";

export default class GetMotorDetUseCase {
  constructor(motorDetRepository) {
    this.motorDetRepository = motorDetRepository;
  }

  async execute(id) {
    const errors = GetMotorDetDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const motorDet = await this.motorDetRepository.findById(id);
    if (!motorDet) {
      throw new Error("Motor de deteccion not found");
    }

    return motorDet;
  }
}
