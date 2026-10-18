import { CreateReporteUDTO } from "../../../domain/reporteU/dtos/createReporteU.dto.js";
import { ReporteUEntity } from "../../../domain/reporteU/entities/reporteU.entity.js";
import {
  sugerirNivelPrioridad,
  combinarNivelPrioridad,
  describirPrediccion,
} from "../../../domain/deteccionImagen/sugerirNivelPrioridad.js";

export default class CreateReporteUUseCase {
  constructor({ reporteURepository, clasificadorImagenRepository = null, realtimeNotifier = null }) {
    this.reporteURepository = reporteURepository;
    this.clasificadorImagenRepository = clasificadorImagenRepository;
    this.realtimeNotifier = realtimeNotifier;
  }

  async execute(reporteUData) {
    const errors = CreateReporteUDTO.validate(reporteUData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const reporteUDTO = new CreateReporteUDTO(reporteUData);

    const prediccion = await this.analizarImagen(reporteUDTO.foto_url);
    let { nivel_prioridad, indicador } = reporteUDTO;
    if (prediccion) {
      nivel_prioridad = combinarNivelPrioridad(nivel_prioridad, sugerirNivelPrioridad(prediccion));
      const nota = describirPrediccion(prediccion);
      indicador = indicador ? `${indicador} | ${nota}` : nota;
    }

    const reporteUEntity = new ReporteUEntity({
      id_reporte_u: null,
      estado: "RECIBIDO",
      fecha_envio: null,
      ...reporteUDTO,
      nivel_prioridad,
      indicador,
    });

    const creado = await this.reporteURepository.create(reporteUEntity);
    await this.realtimeNotifier?.emitReporteCiudadano(creado);

    return creado;
  }

  // La IA nunca bloquea el reporte: si no hay clasificador, la imagen no es
  // propia o el servicio falla/esta caido, se sigue sin escalar prioridad
  // (misma politica conservadora que el motor de deteccion por sensores).
  async analizarImagen(fotoUrl) {
    if (!fotoUrl || !this.clasificadorImagenRepository) return null;

    try {
      return await this.clasificadorImagenRepository.classify(fotoUrl);
    } catch (error) {
      console.warn(`[deteccionImagen] no se pudo analizar la imagen del reporte: ${error.message}`);
      return null;
    }
  }
}
