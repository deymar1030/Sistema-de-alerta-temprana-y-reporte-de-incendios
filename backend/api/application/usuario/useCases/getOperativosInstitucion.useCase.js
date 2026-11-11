import { RolNombres } from "../../../domain/rol/rolNombres.js";

// Lista los OPERATIVO de una institucion, para que el JEFE_INSTITUCION
// elija a quien asignarle una alerta (checkboxes en el frontend web).
// Marca como no disponible a quien ya esta ASIGNADO a otra alerta activa.
export default class GetOperativosInstitucionUseCase {
  constructor({ usuarioRepository, recepcionaRepository }) {
    this.usuarioRepository = usuarioRepository;
    this.recepcionaRepository = recepcionaRepository;
  }

  async execute(id_institucion) {
    const operativos = await this.usuarioRepository.findByInstitucionAndRol(id_institucion, RolNombres.OPERATIVO);
    const idsOperativos = operativos.map((u) => Number(u.id_usuario));
    const asignaciones = await this.recepcionaRepository.findAsignacionesActivas(idsOperativos);
    const asignacionPorUsuario = new Map(asignaciones.map((a) => [Number(a.id_usuario), Number(a.id_alerta)]));

    return operativos.map((operativo) => {
      const id_alerta_asignada = asignacionPorUsuario.get(Number(operativo.id_usuario)) ?? null;
      return { ...operativo, disponible: id_alerta_asignada === null, id_alerta_asignada };
    });
  }
}
