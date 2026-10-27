import prisma from "../../../infrastructure/prismaConfig/prismaClient.js";
import { SensorService } from "./services.js";
import { SensorController } from "./controller.js";
import PrismaSensorRepository from "../../../infrastructure/features/sensor/repositories/sensor.repository.impl.js";
import CreateSensorUseCase from "../../../application/sensor/useCases/createSensor.useCase.js";
import GetAllSensorUseCase from "../../../application/sensor/useCases/getAllSensor.useCase.js";
import GetSensorUseCase from "../../../application/sensor/useCases/getSensor.useCase.js";
import GetLecturasSensorUseCase from "../../../application/sensor/useCases/getLecturasSensor.useCase.js";
import UpdateSensorUseCase from "../../../application/sensor/useCases/updateSensor.useCase.js";
import DeleteSensorUseCase from "../../../application/sensor/useCases/deleteSensor.useCase.js";

export class SensorDependencies {
  static createController() {
    const sensorRepository = new PrismaSensorRepository(prisma);

    const useCases = {
      createSensorUseCase: new CreateSensorUseCase(sensorRepository),
      getAllSensorUseCase: new GetAllSensorUseCase(sensorRepository),
      getSensorUseCase: new GetSensorUseCase(sensorRepository),
      getLecturasSensorUseCase: new GetLecturasSensorUseCase(sensorRepository),
      updateSensorUseCase: new UpdateSensorUseCase(sensorRepository),
      deleteSensorUseCase: new DeleteSensorUseCase(sensorRepository),
    };

    const sensorService = new SensorService(useCases);
    return new SensorController(sensorService);
  }
}
