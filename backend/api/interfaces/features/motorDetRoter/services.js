export class MotorDetService {
  constructor({ getAllMotorDetUseCase, getMotorDetUseCase }) {
    this.getAllMotorDetUseCase = getAllMotorDetUseCase;
    this.getMotorDetUseCase = getMotorDetUseCase;
  }

  async getAll() {
    return await this.getAllMotorDetUseCase.execute();
  }

  async getById(id) {
    return await this.getMotorDetUseCase.execute(id);
  }
}
