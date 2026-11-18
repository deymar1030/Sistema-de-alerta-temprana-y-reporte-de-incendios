import L from 'leaflet'

export interface OpcionesEncuadre {
  centroPorDefecto: L.LatLngTuple
  zoomPorDefecto: number
  zoomUnPunto?: number
  maxZoom?: number
  padding?: number
}

// Ionic crea los mapas mientras anima la entrada de la pagina: el contenedor
// todavia no tiene su tamaño final, el encuadre se calcula mal y luego
// invalidateSize() corrige el tamaño pero no vuelve a encuadrar. Este helper
// recuerda que puntos deben verse y reaplica el encuadre cada vez que el
// contenedor cambia de tamaño, hasta que el usuario mueve o hace zoom.
export function crearEncuadre(map: L.Map, opciones: OpcionesEncuadre) {
  let puntos: L.LatLngTuple[] = []
  let aplicando = false
  let usuarioMovio = false

  const marcarUsuario = () => { if (!aplicando) usuarioMovio = true }
  map.on('dragstart', marcarUsuario)
  map.on('zoomstart', marcarUsuario)

  const aplicar = () => {
    const tamano = map.getSize()
    if (!tamano.x || !tamano.y) return
    aplicando = true
    try {
      if (puntos.length === 0) map.setView(opciones.centroPorDefecto, opciones.zoomPorDefecto, { animate: false })
      else if (puntos.length === 1) map.setView(puntos[0]!, opciones.zoomUnPunto ?? 15, { animate: false })
      else map.fitBounds(L.latLngBounds(puntos), { padding: [opciones.padding ?? 40, opciones.padding ?? 40], maxZoom: opciones.maxZoom ?? 16, animate: false })
    } finally {
      aplicando = false
    }
  }

  return {
    // Fija los puntos que deben verse y encuadra. Si son los mismos de antes
    // (p. ej. una recarga sin cambios) no se pisa lo que el usuario movio.
    encuadrar(nuevos: L.LatLngTuple[]) {
      const validos = nuevos.filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0))
      const iguales = validos.length === puntos.length && validos.every((p, i) => p[0] === puntos[i]![0] && p[1] === puntos[i]![1])
      puntos = validos
      if (!iguales) usuarioMovio = false
      map.invalidateSize()
      if (!usuarioMovio) aplicar()
    },
    // Tras un cambio de tamaño del contenedor o al volver a la pantalla.
    reajustar() {
      map.invalidateSize()
      if (!usuarioMovio) aplicar()
    },
  }
}
