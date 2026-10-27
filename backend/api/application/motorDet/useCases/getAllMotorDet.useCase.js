export default class GetAllMotorDetUseCase {
  constructor(motorDetRepository) {
    this.motorDetRepository = motorDetRepository;
  }

  async execute() {
    return await this.motorDetRepository.findAll();
  }
}
