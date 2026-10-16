import type { AttentionReport } from '../types'

export const reportsMock: AttentionReport[] = [
  {
    id: 'INF-001', incidentId: 'INC-004', institutionId: 'INS-001', status: 'REVISADO', fechaIncidente: '2026-09-12',
    horaRecepcion: '18:17', horaSalida: '18:20', horaLlegada: '18:29', horaControl: '18:47', horaFinalizacion: '18:58',
    personal: 6, vehiculos: 2, personasAfectadas: 0, personasEvacuadas: 4, heridos: 0, fallecidos: 0,
    danosMateriales: 'Daño localizado en cableado del área afectada.', causa: 'Causa preliminar pendiente de informe técnico.',
    acciones: 'Aislamiento del área, control del foco e inspección final.', observaciones: 'Sin propagación a ambientes colindantes.',
    recomendaciones: 'Revisar instalación eléctrica y mantenimiento preventivo.', attachments: [
      { id: 'ATT-001', nombre: 'informe_inc_004.pdf', tipo: 'application/pdf', tamano: 248000, fecha: '2026-09-12T19:10:00-04:00' },
    ],
  },
]
