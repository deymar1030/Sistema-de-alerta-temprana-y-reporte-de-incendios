import prisma from '../../../infrastructure/prismaConfig/prismaClient.js';
import { PrismaDeteccionRepository } from '../../../infrastructure/features/lectura/repositories/deteccion.repository.impl.js';
import { cargarConfiguracionMotor } from '../../../config/motor.config.js';

const repository = new PrismaDeteccionRepository(prisma);
export async function getDeteccion(req, res) {
  const id = String(req.params.id);
  if (!/^[1-9]\d{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
    return res.status(400).json({ success: false, error: 'ID de predio invalido' });
  }
  try {
    const data = await repository.snapshot(id, cargarConfiguracionMotor());
    if (!data) return res.status(404).json({ success: false, error: 'Predio no encontrado' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('[deteccion] No se pudo consultar el estado:', error.message);
    res.status(503).json({ success: false, error: 'Estado del motor no disponible' });
  }
}
