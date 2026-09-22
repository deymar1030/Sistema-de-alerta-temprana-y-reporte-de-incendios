import { alertsMock } from '../mocks/alerts'
import type { AlertEntry } from '../types'

export const alertService = {
  async getAlerts(): Promise<AlertEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return [...alertsMock]
  },

  async getActiveAlerts(): Promise<AlertEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return alertsMock.filter((alert) => alert.estado === 'ACTIVA' || alert.estado === 'EN REVISIÓN')
  },
}
