import crypto from "node:crypto";
import { validarArchivo } from "../../../domain/archivo/validarArchivo.js";
import { ArchivoStorage } from "../../../infrastructure/archivos/archivo.storage.js";

const CARPETA_DEFAULT = "reportes-usuario";
const NOMBRE_VALIDO = /^[a-zA-Z0-9._-]+$/;

export class ArchivoController {
  subir = async (req, res) => {
    const { valido, error, extension } = validarArchivo(req.file);
    if (!valido) return res.status(400).json({ success: false, error });

    const nombre = `${crypto.randomUUID()}.${extension}`;
    await ArchivoStorage.guardar(CARPETA_DEFAULT, nombre, req.file.buffer);

    res.status(201).json({ success: true, data: { url: `/api/archivos/${CARPETA_DEFAULT}/${nombre}` } });
  };

  servir = async (req, res) => {
    const { carpeta, nombre } = req.params;

    if (!NOMBRE_VALIDO.test(carpeta) || !NOMBRE_VALIDO.test(nombre)) {
      return res.status(404).json({ success: false, error: "Archivo no encontrado" });
    }

    const archivo = await ArchivoStorage.leer(carpeta, nombre);
    if (!archivo) return res.status(404).json({ success: false, error: "Archivo no encontrado" });

    res.setHeader("Content-Type", archivo.contentType);
    res.send(archivo.buffer);
  };
}
