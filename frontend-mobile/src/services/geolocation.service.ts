import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import type { ActionResult, LocationData } from '../types'

const demoLocation: LocationData = {
  latitude: -16.4947,
  longitude: -68.1324,
  label: 'Av. Arce, La Paz',
  isDemo: true,
}

export const geolocationService = {
  async getCurrentPosition(): Promise<ActionResult<LocationData>> {
    if (!Capacitor.isNativePlatform()) return { ok: true, data: demoLocation }

    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
      return {
        ok: true,
        data: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
          isDemo: false,
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      return { ok: false, error: message.includes('denied') ? 'PERMISSION_DENIED' : 'FAILED' }
    }
  },
}
