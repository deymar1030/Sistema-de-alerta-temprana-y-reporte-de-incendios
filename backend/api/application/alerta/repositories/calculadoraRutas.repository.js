export default class CalculadoraRutasRepository {
  // Calcula la ruta vial mas corta entre origen (institucion) y destino
  // (incidente). Devuelve { geometry, distance_m, ... } tal cual lo entrega
  // el servicio de rutas. Lanza si el calculo falla.
  async calcular({ origen_latitud, origen_longitud, destino_latitud, destino_longitud }) {
    throw new Error("Method not implemented");
  }
}
