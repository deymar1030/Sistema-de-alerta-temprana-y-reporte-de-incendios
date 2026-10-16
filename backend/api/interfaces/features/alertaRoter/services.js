import { ResponseAlertaDTO } from '../../../domain/alerta/dtos/responseAlerta.dto.js';
import { ResponseEnvioDTO } from '../../../domain/envia/dtos/responseEnvia.dto.js';

export class AlertaService {
  constructor({
    getAllAlertaUseCase,
    getActivasAlertaUseCase,
    getAlertaUseCase,
    recibirEnvioUseCase,
    atenderEnvioUseCase,
    cerrarEnvioUseCase,
    realtimeNotifier,
  }) {
    this.getAllAlertaUseCase = getAllAlertaUseCase;
    this.getActivasAlertaUseCase = getActivasAlertaUseCase;
    this.getAlertaUseCase = getAlertaUseCase;
    this.recibirEnvioUseCase = recibirEnvioUseCase;
    this.atenderEnvioUseCase = atenderEnvioUseCase;
    this.cerrarEnvioUseCase = cerrarEnvioUseCase;
    this.realtimeNotifier = realtimeNotifier;
  }

  async getAll(filters) {
    return await this.getAllAlertaUseCase.execute(filters);
  }

  async getActivas(filters) {
    return await this.getActivasAlertaUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getAlertaUseCase.execute(id);
  }

  async recibir(id_alerta, id_institucion) {
    return this.publicarEnvio(await this.recibirEnvioUseCase.execute(id_alerta, id_institucion));
  }

  async atender(id_alerta, id_institucion) {
    return this.publicarEnvio(await this.atenderEnvioUseCase.execute(id_alerta, id_institucion));
  }

  async cerrar(id_alerta, id_institucion) {
    return this.publicarEnvio(await this.cerrarEnvioUseCase.execute(id_alerta, id_institucion));
  }

  async publicarEnvio(envio) {
    try {
      await this.realtimeNotifier?.emitEnvioActualizado(ResponseEnvioDTO.fromEntity(envio));
      if (envio.alerta_actualizada) await this.realtimeNotifier?.emitAlertaActualizada(ResponseAlertaDTO.fromEntity(envio.alerta_actualizada));
    } catch (error) { console.error('[websocket] cambio ya persistido:', error.message); }
    return envio;
  }
}
