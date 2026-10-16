import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UPLOADS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../uploads");

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export class ArchivoStorage {
  static async guardar(carpeta, nombre, buffer) {
    const carpetaPath = path.join(UPLOADS_DIR, carpeta);
    await fs.mkdir(carpetaPath, { recursive: true });
    await fs.writeFile(path.join(carpetaPath, nombre), buffer);
  }

  static async leer(carpeta, nombre) {
    const ruta = path.join(UPLOADS_DIR, carpeta, nombre);

    try {
      const buffer = await fs.readFile(ruta);
      const contentType = CONTENT_TYPES[path.extname(nombre).toLowerCase()] ?? "application/octet-stream";
      return { buffer, contentType };
    } catch {
      return null;
    }
  }
}
