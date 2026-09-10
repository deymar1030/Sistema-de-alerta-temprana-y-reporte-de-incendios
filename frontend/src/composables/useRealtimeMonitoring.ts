import { computed, onMounted, onUnmounted, ref } from 'vue'

export function useRealtimeMonitoring() {
  const temperature = ref(24.6)
  const smoke = ref(0.12)
  const co = ref(4)
  const risk = ref(28)
  const selectedScenario = ref('Sistema normal')

  const demoScenarios = {
    'Sistema normal': { temperature: 24.6, smoke: 0.12, co: 4, risk: 28 },
    'Temperatura elevada': { temperature: 38.5, smoke: 0.18, co: 7, risk: 57 },
    'Humo detectado': { temperature: 31.2, smoke: 0.46, co: 9, risk: 65 },
    'Temperatura + humo': { temperature: 42.1, smoke: 0.78, co: 11, risk: 78 },
    'Temperatura + humo + CO': { temperature: 48.4, smoke: 1.14, co: 18, risk: 92 },
  }

  const setScenario = (name: string) => {
    const scenario = demoScenarios[name as keyof typeof demoScenarios]
    if (!scenario) return

    selectedScenario.value = name
    temperature.value = scenario.temperature
    smoke.value = scenario.smoke
    co.value = scenario.co
    risk.value = scenario.risk
  }

  const status = computed(() => {
    if (risk.value >= 75) return 'Crítico'
    if (risk.value >= 50) return 'Alto'
    if (risk.value >= 30) return 'Advertencia'
    return 'Normal'
  })

  let intervalId: number | undefined

  onMounted(() => {
    intervalId = window.setInterval(() => {
      temperature.value = Number((temperature.value + (Math.random() - 0.5) * 1.4).toFixed(1))
      smoke.value = Number((smoke.value + (Math.random() - 0.5) * 0.08).toFixed(2))
      co.value = Number((co.value + (Math.random() - 0.5) * 1.8).toFixed(1))
      risk.value = Math.min(100, Math.max(8, Math.round(temperature.value * 1.2 + smoke.value * 40 + co.value * 2.7)))
    }, 3000)
  })

  onUnmounted(() => {
    if (intervalId) window.clearInterval(intervalId)
  })

  return { temperature, smoke, co, risk, status, selectedScenario, setScenario, demoScenarios }
}
