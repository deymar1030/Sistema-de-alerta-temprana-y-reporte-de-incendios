import { timelineMock } from '../mocks/timeline'
import type { IncidentTimelineEvent } from '../types'

export const timelineService = {
  async getEvents(incidentId?: string) {
    return incidentId ? timelineMock.filter((item) => item.incidentId === incidentId) : timelineMock
  },
  async addEvent(input: Omit<IncidentTimelineEvent, 'id' | 'createdAt'> & { createdAt?: string }): Promise<IncidentTimelineEvent> {
    const event: IncidentTimelineEvent = {
      ...input,
      id: `EVT-${String(timelineMock.length + 1).padStart(3, '0')}`,
      createdAt: input.createdAt ?? new Date().toISOString(),
    }
    timelineMock.push(event)
    return event
  },
}
