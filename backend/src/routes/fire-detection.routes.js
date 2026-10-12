import { Router } from "express";
import multer from "multer";

import { envs } from "../config/envs.js";
import { detectFireFromImage } from "../controllers/fire-detection.controller.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: envs.MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("Solo se aceptan imágenes JPG, PNG o WEBP."));
  },
});

export class FireDetectionRouter {
  static get routes() {
    const router = Router();

    // Campo multipart requerido: image
    router.post("/image", upload.single("image"), detectFireFromImage);

    router.use((error, _request, response, _next) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return response.status(413).json({
          error: `La imagen supera el límite de ${envs.MAX_IMAGE_SIZE_MB} MB.`,
        });
      }

      return response.status(400).json({
        error: error.message || "No se pudo procesar el archivo enviado.",
      });
    });

    return router;
  }
}
