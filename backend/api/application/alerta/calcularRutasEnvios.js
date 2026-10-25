// Dispara el calculo de ruta de cada envio en paralelo, sin esperarlo
// (fire-and-forget): corre despues del commit de la alerta, y un servicio de
// rutas caido o lento no debe demorar ni afectar la respuesta al cliente ni
// los eventos ya emitidos. Cada resultado (o error) se persiste por su
// cuenta en la fila de envia correspondiente.
export function calcularRutasEnvios(rutasPendientes, { calculadoraRutasRepository, enviaRepository, logger = console }) {
  if (!calculadoraRutasRepository || !enviaRepository) return;

  for (const ruta of rutasPendientes ?? []) {
    calculadoraRutasRepository
      .calcular({
        origen_latitud: ruta.origen_latitud,
        origen_longitud: ruta.origen_longitud,
        destino_latitud: ruta.destino_latitud,
        destino_longitud: ruta.destino_longitud,
      })
      .then(
        (resultado) => enviaRepository.actualizarRuta(ruta.id_alerta, ruta.id_institucion, {
          ruta_json: JSON.stringify(resultado),
        }),
        (error) => enviaRepository.actualizarRuta(ruta.id_alerta, ruta.id_institucion, {
          ruta_error: String(error.message ?? error).slice(0, 200),
        }),
      )
      .catch((error) => logger.error(`[rutas] no se pudo persistir alerta=${ruta.id_alerta} institucion=${ruta.id_institucion}:`, error.message));
  }
}
