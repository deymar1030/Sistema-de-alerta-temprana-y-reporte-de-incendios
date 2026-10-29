import { ResponseAlertaMapaDTO } from "../../../domain/alerta/dtos/responseAlerta.dto.js";

// El OPERATIVO consulta a que alertas lo asigno su JEFE_INSTITUCION
// (recepciona.estado = ASIGNADO), con la ubicacion resuelta de cada una.
export default class GetMisAsignacionesUseCase {
  constructor(recepcionaRepository) {
    this.recepcionaRepository = recepcionaRepository;
  }

  async execute(id_usuario) {
    const asignaciones = await this.recepcionaRepository.findAsignacionesActivasConAlerta(id_usuario);
    return asignaciones.map((asignacion) => ({
      id_alerta: asignacion.id_alerta,
      fecha_asignacion: asignacion.fecha_asignacion,
      alerta: ResponseAlertaMapaDTO.fromEntity(asignacion.alerta),
    }));
  }
}
