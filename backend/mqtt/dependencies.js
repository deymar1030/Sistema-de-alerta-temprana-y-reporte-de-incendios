import { createMqttMessageHandler } from "./subscriber.js";
import prisma from '../api/infrastructure/prismaConfig/prismaClient.js';
import { PrismaDeteccionRepository } from '../api/infrastructure/features/lectura/repositories/deteccion.repository.impl.js';
import { EvaluarLecturaUseCase } from '../api/application/lectura/useCases/evaluarLectura.useCase.js';
import { cargarConfiguracionMotor } from '../api/config/motor.config.js';
import HttpCalculadoraRutasRepository from '../api/infrastructure/features/alerta/repositories/httpCalculadoraRutas.repository.impl.js';
import PrismaEnviaRepository from '../api/infrastructure/features/envia/repositories/envia.repository.impl.js';

export function createLecturaHandler(notifier) {
  const useCase = new EvaluarLecturaUseCase({ repository: new PrismaDeteccionRepository(prisma),
    notifier, configuracion: cargarConfiguracionMotor(),
    calculadoraRutasRepository: new HttpCalculadoraRutasRepository(),
    enviaRepository: new PrismaEnviaRepository(prisma) });
  return { handleMessage: createMqttMessageHandler((lectura) => useCase.execute(lectura)), useCase };
}
