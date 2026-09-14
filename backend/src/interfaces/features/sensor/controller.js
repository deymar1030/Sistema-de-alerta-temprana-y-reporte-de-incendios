import { CreateSensorUseCase } from "../../../application/sensor/useCases/createSensor.useCase.js";
import { DeleteSensorUseCase } from "../../../application/sensor/useCases/deleteSensor.useCase.js";
import { GetAllSensorUseCase } from "../../../application/sensor/useCases/getAllSensor.useCase.js";
import { GetSensorUseCase } from "../../../application/sensor/useCases/getSensor.useCase.js";
import { UpdateSensorUseCase } from "../../../application/sensor/useCases/updateSensor.useCase.js";
import { SensorRepositoryImpl } from "../../../infrastructure/features/sensor/repositories/sensor.repository.impl.js";

const sensorRepository = new SensorRepositoryImpl();

export class SensorController {
  static async create(req, res) {
    try {
      const useCase = new CreateSensorUseCase(sensorRepository);
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const useCase = new GetAllSensorUseCase(sensorRepository);
      const result = await useCase.execute();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const useCase = new GetSensorUseCase(sensorRepository);
      const result = await useCase.execute(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const useCase = new UpdateSensorUseCase(sensorRepository);
      const result = await useCase.execute(req.params.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const useCase = new DeleteSensorUseCase(sensorRepository);
      const result = await useCase.execute(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}