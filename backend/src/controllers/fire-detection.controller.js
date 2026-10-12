import { envs } from "../config/envs.js";

function upstreamError(status, details) {
  const message =
    details && typeof details === "object" && "detail" in details
      ? details.detail
      : "El servicio de detección no pudo analizar la imagen.";

  const error = new Error(message);
  error.status = status;
  return error;
}

export async function detectFireFromImage(request, response) {
  if (!request.file) {
    return response.status(400).json({
      error: "Envía una imagen en formato multipart/form-data con el campo image.",
    });
  }

  try {
    const form = new FormData();
    const image = new Blob([request.file.buffer], { type: request.file.mimetype });
    form.append("image", image, request.file.originalname);

    const modelResponse = await fetch(`${envs.ML_SERVICE_URL}/predict`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    const payload = await modelResponse.json().catch(() => null);
    if (!modelResponse.ok) {
      throw upstreamError(modelResponse.status, payload);
    }

    return response.status(200).json({
      ...payload,
      filename: request.file.originalname,
    });
  } catch (error) {
    if (error.name === "TimeoutError") {
      return response.status(504).json({
        error: "El análisis de la imagen excedió el tiempo permitido.",
      });
    }

    if (error.cause?.code === "ECONNREFUSED") {
      return response.status(503).json({
        error: "El servicio de detección no está disponible. Inicia ml-service.",
      });
    }

    const status = error.status || 502;
    return response.status(status).json({
      error: error.message || "No fue posible analizar la imagen.",
    });
  }
}
