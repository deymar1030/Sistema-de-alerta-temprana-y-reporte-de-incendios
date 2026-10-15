import prisma from "../api/infrastructure/prismaConfig/prismaClient.js";
import { createMqttMessageHandler } from "./subscriber.js";
import PrismaSensorRepository from "../api/infrastructure/features/sensor/repositories/sensor.repository.impl.js";
import PrismaLecturaRepository from "../api/infrastructure/features/lectura/repositories/lectura.repository.impl.js";
import PrismaAlertaRepository from "../api/infrastructure/features/alerta/repositories/alerta.repository.impl.js";
import PrismaPredioRepository from "../api/infrastructure/features/predio/repositories/predio.repository.impl.js";
import PrismaTransactionManager from "../api/infrastructure/prismaConfig/prismaTransactionManager.js";
import RegistrarLecturaUseCase from "../api/application/lectura/useCases/registrarLectura.useCase.js";
import EvaluarLecturaUseCase from "../api/application/lectura/useCases/evaluarLectura.useCase.js";

export function createLecturaHandler(notifier) {
  const sensorRepository = new PrismaSensorRepository(prisma);
  const lecturaRepository = new PrismaLecturaRepository(prisma);
  const alertaRepository = new PrismaAlertaRepository(prisma);
  const predioRepository = new PrismaPredioRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);

  const registrarLectura = new RegistrarLecturaUseCase({
    sensorRepository,
    lecturaRepository,
    transactionManager,
    realtimeNotifier: notifier,
  });

  const evaluarLectura = new EvaluarLecturaUseCase({
    lecturaRepository,
    alertaRepository,
    predioRepository,
    transactionManager,
    realtimeNotifier: notifier,
  });

  return createMqttMessageHandler(async (lectura) => {
    const registro = await registrarLectura.execute(lectura);

    if (registro.resultado !== "VALIDA") return;

    await evaluarLectura.execute({ lectura: registro.lectura, sensor: registro.sensor });
  });
}
