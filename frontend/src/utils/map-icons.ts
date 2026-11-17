import L from 'leaflet'

// Mapa base de todos los mapas.
export function baseTileLayer(): L.TileLayer {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
}

export type MapIconKind ='alert' | 'predio' | 'institution' | 'sensor' | 'report'

// Trazos de Lucide (flame, house, landmark, radio, megaphone), los mismos de la UI.
const GLYPHS: Record<MapIconKind, string> = {
  alert: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  predio: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  institution: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  sensor: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  report: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
}

const SIZES: Record<MapIconKind, number> = { alert: 36, predio: 30, institution: 30, sensor: 24, report: 28 }

export const DEFAULT_COLORS: Record<MapIconKind, string> = {
  alert: '#dc2626',
  predio: '#ea580c',
  institution: '#335f76',
  sensor: '#47836b',
  report: '#b7791f',
}

export type IrpLevel = 'bajo' | 'moderado' | 'alto' | 'critico'

export const IRP_LEVELS: Array<{ level: IrpLevel; min: number; label: string; color: string }> = [
  { level: 'critico', min: 0.8, label: 'Crítico', color: '#b91c1c' },
  { level: 'alto', min: 0.6, label: 'Alto', color: '#ea580c' },
  { level: 'moderado', min: 0.4, label: 'Moderado', color: '#ca8a04' },
  { level: 'bajo', min: 0, label: 'Bajo', color: '#47836b' },
]

export const IRP_SIN_EVALUAR = { level: 'sin_evaluar', label: 'Sin evaluar', color: '#94a3b8' } as const

export function irpLevel(irp: number | null | undefined): { level: string; label: string; color: string } {
  if (irp == null || !Number.isFinite(irp)) return IRP_SIN_EVALUAR
  return IRP_LEVELS.find(item => irp >= item.min) ?? IRP_LEVELS[IRP_LEVELS.length - 1]!
}

export function irpDescripcion(irp: number | null | undefined): string {
  const level = irpLevel(irp)
  return irp == null || !Number.isFinite(irp)
    ? 'Riesgo sin evaluar (faltan parámetros del IRP)'
    : `Riesgo ${level.label.toLowerCase()} · IRP ${irp.toFixed(2)}`
}

// Alto o crítico: la alerta en ese predio lleva el distintivo "!".
export function irpElevado(irp: number | null | undefined): boolean {
  return irp != null && Number.isFinite(irp) && irp >= 0.6
}

const CHECK_GLYPH = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'

// badge: "!" de predio con IRP elevado. attending: distintivo verde de "en atención".
export function mapIcon(kind: MapIconKind, options: { color?: string; pulse?: boolean; badge?: boolean; attending?: boolean } = {}): L.DivIcon {
  const size = SIZES[kind]
  const color = options.color ?? DEFAULT_COLORS[kind]
  const pulse = options.pulse ?? false
  const glyph = Math.round(size * 0.55)
  return L.divIcon({
    className: 'map-icon-wrapper',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [size / 2, 0],
    html: `${pulse ? `<span class="map-icon-pulse" style="--map-icon-color:${color}"></span><span class="map-icon-pulse map-icon-pulse-delayed" style="--map-icon-color:${color}"></span>` : ''}`
      + `<span class="map-icon map-icon-${kind}" style="background:${color}">`
      + `<svg xmlns="http://www.w3.org/2000/svg" width="${glyph}" height="${glyph}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[kind]}</svg>`
      + '</span>'
      + (options.badge ? '<span class="map-icon-badge" aria-hidden="true">!</span>' : '')
      + (options.attending ? `<span class="map-icon-attending" aria-hidden="true">${CHECK_GLYPH}</span>` : ''),
  })
}
