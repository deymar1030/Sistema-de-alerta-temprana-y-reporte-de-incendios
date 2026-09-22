import { readingsMock } from '../mocks/readings'
import type { Reading } from '../types'

export const readingService = {
  async getReadings(): Promise<Reading[]> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return [...readingsMock]
  },

  async getReadingsBySensor(sensorId: string): Promise<Reading[]> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return readingsMock.filter((reading) => reading.id_sensor === sensorId)
  },
}
