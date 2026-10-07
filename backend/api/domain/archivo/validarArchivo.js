const TIPOS_PERMITIDOS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TAMANO_MAX_BYTES = 5 * 1024 * 1024;

export function validarArchivo(file) {
  if (!file) return { valido: false, error: "Missing archivo" };

  const extension = TIPOS_PERMITIDOS[file.mimetype];
  if (!extension) return { valido: false, error: "El archivo debe ser jpg, jpeg, png o webp" };

  if (file.size > TAMANO_MAX_BYTES) return { valido: false, error: "El archivo no debe superar los 5 MB" };

  return { valido: true, extension };
}
