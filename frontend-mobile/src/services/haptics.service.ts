import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

export const hapticsService = {
  async lightImpact(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return
    try {
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch {
      return
    }
  },
}
