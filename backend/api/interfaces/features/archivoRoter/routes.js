import { Router } from "express";
import multer from "multer";
import { ArchivoController } from "./controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export class ArchivoRouter {
  static get routes() {
    const router = Router();

    const archivoController = new ArchivoController();

    router.post("/", upload.single("archivo"), archivoController.subir);
    router.get("/:carpeta/:nombre", archivoController.servir);

    router.use((error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    });

    return router;
  }
}
