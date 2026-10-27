import { resolverConfiguracion } from '../../../domain/motorDeteccion/configuracion.js';
import { evaluarPredio, inicioAlerta } from '../../../domain/motorDeteccion/evaluarPredio.js';
import { ResponseAlertaDTO } from '../../../domain/alerta/dtos/responseAlerta.dto.js';
import { ResponseLecturaDTO } from '../../../domain/lectura/dtos/responseLectura.dto.js';

const predioPublico = (p) => ({ id_predio: p.id_predio, nombre: p.nombre, tipo_predio: p.tipo_predio,
  latitud: Number(p.latitud), longitud: Number(p.longitud), irp: p.irp == null ? null : Number(p.irp) });

export class EvaluarLecturaUseCase {
  constructor({ repository, notifier, configuracion = {}, reloj = () => new Date(), logger = console }) {
    Object.assign(this, { repository, notifier, configuracion, reloj, logger });
  }
  async publicar(resultado) {
    for (const [metodo, payload] of resultado.eventos ?? []) {
      try { await this.notifier[metodo](payload); }
      catch (error) { this.logger.error(`[deteccion] evento posterior al commit: ${metodo}`, error.message); }
    }
    return resultado;
  }
  async resolverAlerta(tx, contexto, alerta, resultado, ahora, eventos, nueva = false) {
    if (!alerta || alerta.estado !== 'EN_EVALUACION') return alerta;
    const actualizada = await tx.actualizarAlerta(alerta, resultado, ahora);
    const payload = { ...ResponseAlertaDTO.fromEntity(actualizada), id_predio: contexto.predio.id_predio,
      predio: predioPublico(contexto.predio), sensores: resultado.sensores,
      datos_suficientes: resultado.datosSuficientes, confirmacion_disponible: resultado.confirmacionDisponible };
    if (actualizada.estado === 'CONFIRMADA') {
      const { envios, notificaciones } = await tx.distribuir(actualizada, contexto.predio, ahora);
      Object.assign(payload, await tx.detalle(actualizada));
      eventos.push(['emitAlertaConfirmada', payload]);
      envios.forEach((e) => eventos.push(['emitEnvioActualizado', e]));
      notificaciones.forEach((n) => eventos.push(['emitNotificacion', n]));
    } else if (actualizada.estado === 'DESCARTADA') {
      eventos.push(['emitAlertaDescartada', payload]);
    } else {
      eventos.push([nueva ? 'emitAlertaAbierta' : 'emitAlertaActualizada', payload]);
    }
    return actualizada;
  }
  async execute(lectura) {
    const ahora = this.reloj();
    const resultado = await this.repository.enPredio(lectura.id_predio, async (tx) => {
      const eventos = [];
      const sensor = await tx.sensor(lectura.id_sensor);
      if (!sensor || String(sensor.id_predio) !== String(lectura.id_predio)) return { ignorada: 'SENSOR_NO_PERTENECE_AL_PREDIO', eventos };
      if (sensor.estado !== 'ACTIVO') return { ignorada: 'SENSOR_INACTIVO', eventos };
      if (await tx.duplicada(lectura)) return { duplicada: true, eventos };
      const ultima = await tx.ultima(sensor.id_sensor);
      const invalida = lectura.valor < Number(sensor.rango_min) || lectura.valor > Number(sensor.rango_max) ||
        +lectura.fecha_hora > +ahora || (ultima && +lectura.fecha_hora <= +ultima.fecha_hora);
      if (invalida) {
        const guardada = await tx.registrarLectura(lectura, sensor, 'INVALIDA');
        eventos.push(['emitLecturaNueva', { ...ResponseLecturaDTO.fromEntity(guardada), id_predio: sensor.id_predio }]);
        return { lectura: guardada, eventos };
      }
      const contexto = await tx.contexto(sensor.id_predio, ahora);
      const config = resolverConfiguracion(contexto.motor, this.configuracion);
      const propio = contexto.sensores.find((s) => String(s.id_sensor) === String(sensor.id_sensor));
      propio.lecturas.push({ ...lectura, estado_lectura: 'VALIDA', id_alerta: null });
      let alerta = await tx.alertaActiva(sensor.id_predio);
      const evaluacion = evaluarPredio({ ...contexto, config, ahora, alerta });
      const senal = evaluacion.sensores.find((s) => String(s.id_sensor) === String(sensor.id_sensor));
      let nueva = false;
      if (!alerta && senal.anomala) {
        const descarte = await tx.ultimoDescarte(sensor.id_predio);
        const espera = descarte && +ahora - +descarte.fecha_cierre < config.esperaMinutos * 60000;
        if (!espera || senal.critico) {
          alerta = await tx.abrirAlerta(sensor.id_predio, ahora, config.contextoMinutos);
          nueva = true;
        }
      }
      const guardada = await tx.registrarLectura(lectura, sensor, senal.anomala ? 'ANOMALA' : 'VALIDA', alerta?.id_alerta ?? null);
      eventos.push(['emitLecturaNueva', { ...ResponseLecturaDTO.fromEntity(guardada), id_predio: sensor.id_predio }]);
      alerta = await this.resolverAlerta(tx, contexto, alerta, evaluacion, ahora, eventos, nueva);
      return { lectura: guardada, alerta, eventos };
    });
    if (resultado.ignorada) this.logger.warn(`[deteccion] ${resultado.ignorada}: predio=${lectura.id_predio} sensor=${lectura.id_sensor}`);
    return this.publicar(resultado);
  }
  async vencerAlertas() {
    for (const id of await this.repository.prediosEnEvaluacion()) {
      const ahora = this.reloj();
      const resultado = await this.repository.enPredio(id, async (tx) => {
        const eventos = [];
        const alerta = await tx.alertaActiva(id);
        if (!alerta || alerta.estado !== 'EN_EVALUACION') return { eventos };
        const contexto = await tx.contexto(id, ahora);
        if (+ahora - +inicioAlerta(alerta) < Number(contexto.motor.tiempo_max_evaluacion_min) * 60000) return { eventos };
        const config = resolverConfiguracion(contexto.motor, this.configuracion);
        const evaluacion = evaluarPredio({ ...contexto, config, ahora, alerta });
        // Sin lecturas nuevas no se inventa una confirmacion. El plazo del episodio se cumple aun con sensores caidos.
        await this.resolverAlerta(tx, contexto, alerta, { ...evaluacion, estado: 'DESCARTADA', clasificacion: 'SIN_EVIDENCIA' }, ahora, eventos);
        return { eventos };
      });
      await this.publicar(resultado);
    }
  }
}
