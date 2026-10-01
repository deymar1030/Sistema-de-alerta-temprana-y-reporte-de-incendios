<script setup lang="ts">
import type { TimelineEvent, TimelineEventType } from '../../types'

defineProps<{ events: TimelineEvent[] }>()

const eventLabels: Record<TimelineEventType, string> = {
  ALERTA_RECIBIDA: 'Alerta recibida',
  RECEPCION_CONFIRMADA: 'Recepción confirmada',
  UNIDAD_EN_CAMINO: 'En camino',
  LLEGADA_AL_LUGAR: 'Llegada al lugar',
  INCENDIO_CONTROLADO: 'Incendio controlado',
  INTERVENCION_FINALIZADA: 'Intervención finalizada',
}

const formatTime = (timestamp: string) => new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
}).format(new Date(timestamp))
</script>

<template>
  <div class="timeline">
    <div v-for="event in events" :key="event.id" class="timeline-item">
      <div class="timeline-marker" />
      <div class="timeline-body">
        <div class="time-row">
          <span class="time">{{ formatTime(event.timestamp) }}</span>
          <span class="title">{{ eventLabels[event.type] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  position: relative;
  margin-top: 1rem;
  padding-left: 0.4rem;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 0.38rem;
  top: 0.25rem;
  bottom: 0.25rem;
  width: 2px;
  background: rgba(212, 218, 215, 0.95);
}
.timeline-item {
  position: relative;
  display: flex;
  gap: 0.85rem;
  padding: 0.3rem 0 0.9rem;
}
.timeline-marker {
  position: relative;
  z-index: 1;
  width: 0.85rem;
  height: 0.85rem;
  margin-top: 0.15rem;
  border-radius: 50%;
  background: linear-gradient(180deg, #f4a259 0%, #d66d34 100%);
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(244, 162, 89, 0.15);
}
.timeline-body {
  flex: 1;
}
.time-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.2rem;
}
.time {
  font-size: 0.72rem;
  font-weight: 700;
  color: #596773;
}
.title {
  font-weight: 600;
  color: #17212b;
}
.timeline-body p {
  margin: 0;
  font-size: 0.8rem;
  color: #596773;
}
</style>
