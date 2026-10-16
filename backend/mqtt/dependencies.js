import { createMqttMessageHandler } from "./subscriber.js";
import prisma from '../api/infrastructure/prismaConfig/prismaClient.js';
import { PrismaDeteccionRepository } from '../api/infrastructure/features/lectura/repositories/deteccion.repository.impl.js';
import { EvaluarLecturaUseCase } from '../api/application/lectura/useCases/evaluarLectura.useCase.js';
import { cargarConfiguracionMotor } from '../api/config/motor.config.js';

export function createLecturaHandler(notifier) {
  const useCase = new EvaluarLecturaUseCase({ repository: new PrismaDeteccionRepository(prisma),
    notifier, configuracion: cargarConfiguracionMotor() });
  return { handleMessage: createMqttMessageHandler((lectura) => useCase.execute(lectura)), useCase };
}
