import { sensorsMock } from '../mocks/sensors'
import type { Sensor } from '../types'

export const sensorService = {
  async getSensors(): Promise<Sensor[]> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return [...sensorsMock]
  },

  async getSensorById(id: string): Promise<Sensor | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 220))
    return sensorsMock.find((sensor) => sensor.id_sensor === id)
  },
}
