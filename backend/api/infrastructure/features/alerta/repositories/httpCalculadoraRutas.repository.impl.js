import CalculadoraRutasRepository from "../../../../application/alerta/repositories/calculadoraRutas.repository.js";
import { envs } from "../../../../config/envs.js";

export default class HttpCalculadoraRutasRepository extends CalculadoraRutasRepository {
  async calcular({ origen_latitud, origen_longitud, destino_latitud, destino_longitud }) {
    let response;
    try {
      response = await fetch(`${envs.ROUTING_SERVICE_URL}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_latitude: origen_latitud,
          origin_longitude: origen_longitud,
          destination_latitude: destino_latitud,
          destination_longitude: destino_longitud,
        }),
        signal: AbortSignal.timeout(envs.ROUTING_SERVICE_TIMEOUT_MS),
      });
    } catch (error) {
      if (error.name === "TimeoutError") {
        throw new Error("El calculo de ruta excedio el tiempo permitido.");
      }
      if (error.cause?.code === "ECONNREFUSED") {
        throw new Error("El servicio de rutas no esta disponible.");
      }
      throw error;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : `HTTP ${response.status}`;
      throw new Error(`routing-service respondio con error: ${detail}`);
    }

    return payload;
  }
}
