import { RolNombres } from "../../../domain/rol/rolNombres.js";

// Lista los OPERATIVO de una institucion, para que el JEFE_INSTITUCION
// elija a quien asignarle una alerta (checkboxes en el frontend web).
export default class GetOperativosInstitucionUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id_institucion) {
    return await this.usuarioRepository.findByInstitucionAndRol(id_institucion, RolNombres.OPERATIVO);
  }
}
