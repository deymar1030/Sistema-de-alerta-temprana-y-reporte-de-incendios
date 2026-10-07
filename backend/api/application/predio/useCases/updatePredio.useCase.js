import { UpdatePredioDTO } from "../../../domain/predio/dtos/updatePredio.dto.js";
import { calcularIrp } from "../../../domain/predio/calcularIrp.js";

const CAMPOS_IRP = [
  "estado_electrico",
  "estado_gas",
  "fuentes_calor",
  "carga_combustible",
  "material_construccion",
  "ocupacion",
  "nivel_proteccion",
];

export default class UpdatePredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute(id, predioData) {
    const errors = UpdatePredioDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existente = await this.predioRepository.findById(id);
    if (!existente) {
      throw new Error("Predio not found");
    }

    const datosFinales = { ...predioData };
    const tocaIrp = CAMPOS_IRP.some((campo) => predioData[campo] !== undefined);

    if (tocaIrp) {
      const valoresCombinados = {};
      for (const campo of CAMPOS_IRP) {
        valoresCombinados[campo] = predioData[campo] !== undefined ? predioData[campo] : existente[campo];
      }
      datosFinales.irp = calcularIrp(valoresCombinados);
    }

    const predioDTO = new UpdatePredioDTO(datosFinales);

    return await this.predioRepository.update(id, predioDTO);
  }
}
