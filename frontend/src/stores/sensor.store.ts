import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { sensorService, type CreateSensorInput } from '../services/sensor.service'
import type { Sensor } from '../types'

export const useSensorStore = defineStore('sensor', () => {
  const sensors = ref<Sensor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeSensors = computed(() => sensors.value.filter((sensor) => sensor.estado === 'Activo').length)

  const fetchSensors = async () => {
    loading.value = true
    error.value = null
    try {
      sensors.value = await sensorService.getSensors()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No fue posible obtener los datos de sensores.'
    } finally {
      loading.value = false
    }
  }

  const getSensorById = async (id: string) => {
    return await sensorService.getSensorById(id)
  }

  const createSensor = async (input: CreateSensorInput) => {
    const created = await sensorService.createSensor(input)
    sensors.value = [created, ...sensors.value.filter((sensor) => sensor.id_sensor !== created.id_sensor)]
    return created
  }

  const updateSensor = async (id: string, input: Partial<CreateSensorInput>) => {
    const updated = await sensorService.updateSensor(id, input)
    sensors.value = sensors.value.map((sensor) => (sensor.id_sensor === id ? updated : sensor))
    return updated
  }

  const deleteSensor = async (id: string) => {
    await sensorService.deleteSensor(id)
    sensors.value = sensors.value.filter((sensor) => sensor.id_sensor !== id)
  }

  return { sensors, loading, error, activeSensors, fetchSensors, getSensorById, createSensor, updateSensor, deleteSensor }
})
