import { filtroHampel } from './filtroHampel.js';
import { normalizarVariable } from '../sensor/tiposSensor.js';

// Lecturas de evidencia recibidas despues del primer valor critico que ya
// disparo el aviso a las instituciones. Silencio o lecturas mezcladas
// sostienen la alerta: el incendio tambien puede danar el sensor o producir
// datos inconsistentes. Solo una ventana enteramente limpia la corrige.
export function ventanaCorregida({ sensoresEvidencia, motor, config, fechaPicoCritico, ahora }) {
  let huboLecturas = false;
  for (const sensor of sensoresEvidencia) {
    const variable = normalizarVariable(sensor.tipo_sensor);
    const p = config.variables[variable];
    if (!p || p.signo == null) continue;
    const registros = sensor.lecturas
      .filter((l) => l.estado_lectura !== 'INVALIDA')
      .sort((a, b) => +a.fecha_hora - +b.fecha_hora);
    const referencia = registros
      .filter((l) => l.estado_lectura === 'VALIDA' && l.id_alerta == null &&
        +l.fecha_hora < +fechaPicoCritico && +l.fecha_hora >= +fechaPicoCritico - Number(motor.ventana_base_min) * 60000)
      .map((l) => Number(l.valor) * p.signo);
    const valores = referencia.length >= config.minLecturasBase ? referencia : [];
    const enVentana = registros.filter((l) => +l.fecha_hora > +fechaPicoCritico && +l.fecha_hora <= +ahora);
    for (const l of enVentana) {
      huboLecturas = true;
      const critico = p.umbralCritico != null && Number(l.valor) * p.signo >= p.umbralCritico * p.signo;
      const { esAnomala } = filtroHampel(valores, Number(l.valor) * p.signo, p.madMin, Number(motor.umbral_z));
      if (critico || esAnomala) return false;
    }
  }
  return huboLecturas;
}
