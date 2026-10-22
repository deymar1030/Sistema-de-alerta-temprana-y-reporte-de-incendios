import ClasificadorImagenRepository from "../../../../application/deteccionImagen/repositories/clasificadorImagen.repository.js";
import { ArchivoStorage } from "../../../archivos/archivo.storage.js";
import { envs } from "../../../../config/envs.js";

// foto_url siempre tiene esta forma -- la arma ArchivoController.subir().
const FOTO_URL_PATTERN = /^\/api\/archivos\/(reportes-usuario)\/([a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))$/;

export default class HttpClasificadorImagenRepository extends ClasificadorImagenRepository {
  async classify(fotoUrl) {
    if (!fotoUrl) return null;

    const match = FOTO_URL_PATTERN.exec(fotoUrl);
    if (!match) return null;

    const [, carpeta, nombre] = match;
    const archivo = await ArchivoStorage.leer(carpeta, nombre);
    if (!archivo) return null;

    const form = new FormData();
    form.append("image", new Blob([archivo.buffer], { type: archivo.contentType }), nombre);

    let response;
    try {
      response = await fetch(`${envs.ML_SERVICE_URL}/predict`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(envs.ML_SERVICE_TIMEOUT_MS),
      });
    } catch (error) {
      if (error.name === "TimeoutError") {
        throw new Error("El analisis de la imagen excedio el tiempo permitido.");
      }
      if (error.cause?.code === "ECONNREFUSED") {
        throw new Error("El servicio de deteccion de imagenes no esta disponible.");
      }
      throw error;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : `HTTP ${response.status}`;
      throw new Error(`ml-service respondio con error: ${detail}`);
    }

    if (!payload || typeof payload.detected !== 'boolean' ||
        !Number.isFinite(payload.fire_probability) || payload.fire_probability < 0 || payload.fire_probability > 1 ||
        !Number.isFinite(payload.threshold) || payload.threshold <= 0 || payload.threshold >= 1 ||
        payload.detected !== (payload.fire_probability >= payload.threshold)) {
      throw new Error('Respuesta de vision invalida');
    }
    return payload;
  }
}
