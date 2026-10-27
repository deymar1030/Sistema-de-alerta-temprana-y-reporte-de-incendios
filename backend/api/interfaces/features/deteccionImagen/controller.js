import crypto from "node:crypto";

import { validarArchivo } from "../../../domain/archivo/validarArchivo.js";
import { ArchivoStorage } from "../../../infrastructure/archivos/archivo.storage.js";
import HttpClasificadorImagenRepository from "../../../infrastructure/features/deteccionImagen/repositories/httpClasificadorImagen.repository.impl.js";

const CARPETA = "reportes-usuario";

export class DeteccionImagenController {
  constructor() {
    this.clasificador = new HttpClasificadorImagenRepository();
  }

  analizar = async (req, res) => {
    const { valido, error, extension } = validarArchivo(req.file);
    if (!valido) return res.status(400).json({ success: false, error });

    try {
      const nombre = `${crypto.randomUUID()}.${extension}`;
      await ArchivoStorage.guardar(CARPETA, nombre, req.file.buffer);

      const foto_url = `/api/archivos/${CARPETA}/${nombre}`;
      const deteccion = await this.clasificador.classify(foto_url);

      return res.status(201).json({
        success: true,
        data: { foto_url, filename: nombre, ...deteccion },
      });
    } catch (error) {
      console.error("[deteccionImagen] no se pudo analizar la imagen:", error.message);
      return res.status(502).json({
        success: false,
        error: "No se pudo analizar la imagen con el servicio de detección.",
      });
    }
  };
}
