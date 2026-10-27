import { Router } from "express";
import multer from "multer";

import { DeteccionImagenController } from "./controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export class DeteccionImagenRouter {
  static get routes() {
    const router = Router();
    const controller = new DeteccionImagenController();

    // multipart/form-data, campo requerido: archivo
    router.post("/", upload.single("archivo"), controller.analizar);

    router.use((error, _req, res, next) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, error: "La imagen no debe superar los 5 MB" });
      }
      return next(error);
    });

    return router;
  }
}
