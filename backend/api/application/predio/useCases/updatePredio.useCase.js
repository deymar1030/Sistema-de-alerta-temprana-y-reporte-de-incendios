import { UpdatePredioDTO } from "../../../domain/predio/dtos/updatePredio.dto.js";
import { calcularIrp } from "../../../domain/predio/calcularIrp.js";
import { Hash } from "../../../config/hash.js";

const MAX_LENGTH = 128;
const MIN_CONTRASENA_MQTT_LENGTH = 8;

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

    if (predioData.contrasena_mqtt !== undefined) {
      if (typeof predioData.contrasena_mqtt !== "string" || predioData.contrasena_mqtt.length < MIN_CONTRASENA_MQTT_LENGTH) {
        throw new Error(`Validation errors: contrasena_mqtt must be at least ${MIN_CONTRASENA_MQTT_LENGTH} characters`);
      }
      if (predioData.contrasena_mqtt.length > MAX_LENGTH) {
        throw new Error("Validation errors: contrasena_mqtt too long");
      }
    }

    const datosFinales = { ...predioData };
    if (predioData.contrasena_mqtt !== undefined) {
      datosFinales.contrasena_mqtt = await Hash.hash(predioData.contrasena_mqtt);
    }
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
