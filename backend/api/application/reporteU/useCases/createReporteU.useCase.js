import { CreateReporteUDTO } from '../../../domain/reporteU/dtos/createReporteU.dto.js';
import { ReporteUEntity } from '../../../domain/reporteU/entities/reporteU.entity.js';
import { ResponseAlertaDTO } from '../../../domain/alerta/dtos/responseAlerta.dto.js';
import { sugerirNivelPrioridad, combinarNivelPrioridad, describirPrediccion, describirUbicacion } from '../../../domain/deteccionImagen/sugerirNivelPrioridad.js';
import { calcularRutasEnvios } from '../../../application/alerta/calcularRutasEnvios.js';

export default class CreateReporteUUseCase {
  constructor({
    reporteURepository, clasificadorImagenRepository = null, alertaDesdeReporteRepository = null,
    realtimeNotifier = null, calculadoraRutasRepository = null, enviaRepository = null,
  }) {
    Object.assign(this, {
      reporteURepository, clasificadorImagenRepository, alertaDesdeReporteRepository,
      realtimeNotifier, calculadoraRutasRepository, enviaRepository,
    });
  }
  async execute(data) {
    const errors = CreateReporteUDTO.validate(data);
    if (errors.length) throw new Error(`Validation errors: ${errors.join(', ')}`);
    const dto = new CreateReporteUDTO(data);
    const prediccion = await this.analizarImagen(dto.foto_url);
    const indicador = [
      dto.indicador,
      prediccion ? describirPrediccion(prediccion) : dto.foto_url ? 'Analisis IA no disponible: imagen pendiente de revision; no confirma ni descarta incendio.' : null,
      describirUbicacion(dto.ubicacion_tipo),
    ].filter(Boolean).join(' | ') || null;
    const entity = new ReporteUEntity({
      ...dto, id_reporte_u: null, estado: 'RECIBIDO', fecha_envio: null, indicador,
      nivel_prioridad: combinarNivelPrioridad(dto.nivel_prioridad, sugerirNivelPrioridad(prediccion)),
    });
    let creado, resultado;
    if (sugerirNivelPrioridad(prediccion) === 'ALTA') {
      if (!this.alertaDesdeReporteRepository) throw new Error('Distribucion de alertas no configurada');
      resultado = await this.alertaDesdeReporteRepository.crearReporteConAlerta({ reporteU: entity, prediccion, ahora: new Date() });
      creado = { ...resultado.reporteU, alerta_vinculada: { id_alerta: resultado.alerta.id_alerta, estado: resultado.alerta.estado } };
    } else {
      creado = await this.reporteURepository.create(entity);
    }
    // Los eventos se emiten despues del commit. Un fallo de transporte no
    // convierte una escritura correcta en un error que provoque reintentos.
    await this.emitir('emitReporteCiudadano', creado);
    if (resultado) {
      await this.emitir('emitAlertaConfirmada', { ...ResponseAlertaDTO.fromEntity(resultado.alerta), reporte_origen: creado });
      for (const envio of resultado.envios) await this.emitir('emitEnvioActualizado', envio);
      for (const notificacion of resultado.notificaciones) await this.emitir('emitNotificacion', notificacion);
      calcularRutasEnvios(resultado.rutasPendientes, {
        calculadoraRutasRepository: this.calculadoraRutasRepository,
        enviaRepository: this.enviaRepository,
      });
    }
    return creado;
  }
  async emitir(metodo, payload) {
    try { await this.realtimeNotifier?.[metodo](payload); }
    catch { console.error(`[deteccionImagen] evento ${metodo} no entregado; datos persistidos`); }
  }
  async analizarImagen(fotoUrl) {
    if (!fotoUrl || !this.clasificadorImagenRepository) return null;
    try { return await this.clasificadorImagenRepository.classify(fotoUrl); }
    catch { console.warn('[deteccionImagen] analisis no disponible'); return null; }
  }
}
