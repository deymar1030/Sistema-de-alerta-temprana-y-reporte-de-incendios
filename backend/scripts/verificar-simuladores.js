import 'dotenv/config';
import prisma from '../api/infrastructure/prismaConfig/prismaClient.js';
import { leerSimuladores } from './provisionar-mqtt.js';
import { normalizarVariable } from '../api/domain/sensor/tiposSensor.js';
import { resolverConfiguracion } from '../api/domain/motorDeteccion/configuracion.js';
import { cargarConfiguracionMotor } from '../api/config/motor.config.js';

try {
  const errores = [], config = cargarConfiguracionMotor();
  for (const p of leerSimuladores(process.argv[2])) {
    const predio = await prisma.predio.findUnique({ where: { id_predio: BigInt(p.id_predio) }, include: { motor_det: { include: { parametro_variable: true } }, sensor: true } });
    if (!predio) { errores.push(`Predio ${p.id_predio}: no registrado`); continue; }
    const motor = resolverConfiguracion(predio.motor_det, config);
    for (const s of p.sensores) {
      const real = predio.sensor.find((x) => String(x.id_sensor) === String(s.id_sensor));
      if (!real) { errores.push(`Sensor ${s.id_sensor}: no pertenece al predio ${p.id_predio}`); continue; }
      if (normalizarVariable(real.tipo_sensor) !== s.tipo_variable || real.unidad_medida !== s.unidad) errores.push(`Sensor ${s.id_sensor}: variable/unidad distinta a la BD`);
      if (real.estado !== 'ACTIVO') errores.push(`Sensor ${s.id_sensor}: no activo`);
      if (!motor.variables[s.tipo_variable]) errores.push(`Motor ${predio.id_motordet}: sin parametros para ${s.tipo_variable}`);
      if (s.rango_min < Number(real.rango_min) || s.rango_max > Number(real.rango_max)) errores.push(`Sensor ${s.id_sensor}: rango de simulacion excede al registrado`);
    }
  }
  if (errores.length) { console.error(errores.join('\n')); process.exitCode = 1; }
  else console.log('Predios, sensores, variables, unidades y parametros compatibles. Consulta de solo lectura.');
} finally { await prisma.$disconnect(); }
