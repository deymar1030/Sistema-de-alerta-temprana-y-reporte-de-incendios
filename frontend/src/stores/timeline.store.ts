import { defineStore } from 'pinia'
import { ref } from 'vue'
import { timelineService } from '../services/timeline.service'
import type { IncidentTimelineEvent } from '../types'

export const useTimelineStore = defineStore('timeline', () => {
  const events = ref<IncidentTimelineEvent[]>([])
  const fetchEvents = async () => { events.value = await timelineService.getEvents() }
  const addEvent = async (input: Omit<IncidentTimelineEvent, 'id' | 'createdAt'> & { createdAt?: string }) => {
    const event = await timelineService.addEvent(input)
    events.value = await timelineService.getEvents()
    return event
  }
  const forIncident = (incidentId: string) => events.value.filter((event) => event.incidentId === incidentId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return { events, fetchEvents, addEvent, forIncident }
})
