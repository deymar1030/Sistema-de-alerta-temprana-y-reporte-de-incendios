export default class ClasificadorImagenRepository {
  // Devuelve la prediccion del modelo (label, detected, fire_probability,
  // no_fire_probability, threshold, warning) o null si foto_url no es un
  // archivo propio que se pueda analizar. Lanza si el servicio de IA falla.
  async classify(fotoUrl) {
    throw new Error("Method not implemented");
  }
}
