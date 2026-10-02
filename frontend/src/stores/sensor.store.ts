import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { sensorService } from '../services/sensor.service'
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
      error.value = 'No fue posible obtener los datos de sensores.'
    } finally {
      loading.value = false
    }
  }

  const getSensorById = async (id: string) => {
    return await sensorService.getSensorById(id)
  }

  return { sensors, loading, error, activeSensors, fetchSensors, getSensorById }
})
