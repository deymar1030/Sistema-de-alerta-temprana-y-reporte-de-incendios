import { apiFetch } from './http'
import type { CitizenReport } from '../types'

const REPORTS_STORAGE_KEY = 'alerta_mobile_citizen_reports'

function normalizeReport(payload: any): CitizenReport {
  const latitude = Number(payload?.location?.coordinates?.latitude ?? payload?.latitud ?? payload?.latitude ?? -33.4489)
  const longitude = Number(payload?.location?.coordinates?.longitude ?? payload?.longitud ?? payload?.longitude ?? -70.6693)
  const statusValue = payload?.status ?? payload?.estado ?? 'PENDIENTE_DE_VALIDACION'

  return {
    id: String(payload?.id ?? payload?.reporte_id ?? payload?.reportId ?? crypto.randomUUID()),
    citizenId: payload?.citizenId ?? payload?.id_ciudadano ?? payload?.ciudadano_id,
    description: payload?.description ?? payload?.descripcion ?? 'Reporte ciudadano.',
    incidentType: payload?.incidentType ?? payload?.tipo_incidente ?? payload?.tipo ?? 'INCENDIO',
    location: {
      city: payload?.location?.city ?? payload?.ciudad ?? 'Sin ubicación',
      coordinates: {
        latitude,
        longitude,
      },
    },
    photo: payload?.photo ?? payload?.imageUrl ?? payload?.evidenceImage,
    photoUrl: payload?.photoUrl ?? payload?.foto_url ?? payload?.imageUrl ?? payload?.evidenceImage ?? payload?.photo,
    smokeVisible: Boolean(payload?.smokeVisible ?? payload?.humo_visible ?? false),
    flamesVisible: Boolean(payload?.flamesVisible ?? payload?.llamas_visible ?? false),
    peopleAtRisk: Boolean(payload?.peopleAtRisk ?? payload?.personas_en_riesgo ?? false),
    explosions: Boolean(payload?.explosiones ?? payload?.explosions ?? false),
    status: statusValue as CitizenReport['status'],
    createdAt: payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
  }
}

const readLocalReports = (): CitizenReport[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(REPORTS_STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list.map(normalizeReport) : []
  } catch {
    return []
  }
}

const persistLocalReports = (reports: CitizenReport[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
}

export const citizenReportService = {
  async createReport(
    payload: Partial<CitizenReport> & {
      latitude?: number
      longitude?: number
      id_institucion?: string
      descripcion?: string
      foto_url?: string
    },
  ): Promise<CitizenReport> {
    const report: CitizenReport = normalizeReport({
      id: payload.id ?? crypto.randomUUID(),
      citizenId: payload.citizenId ?? 'demo-citizen',
      description: payload.description ?? payload.descripcion ?? 'Reporte ciudadano.',
      incidentType: payload.incidentType ?? 'INCENDIO',
      location: {
        city: 'Sin ubicación',
        coordinates: {
          latitude: Number(payload.latitude ?? -33.4489),
          longitude: Number(payload.longitude ?? -70.6693),
        },
      },
      photo: payload.photo ?? payload.photoUrl,
      photoUrl: payload.photoUrl ?? payload.foto_url ?? payload.photo,
      smokeVisible: payload.smokeVisible ?? false,
      flamesVisible: payload.flamesVisible ?? false,
      peopleAtRisk: payload.peopleAtRisk ?? false,
      explosions: payload.explosions ?? false,
      status: payload.status ?? 'PENDIENTE_DE_VALIDACION',
      createdAt: payload.createdAt ?? new Date().toISOString(),
    })

    const stored = readLocalReports()
    const nextReports = [report, ...stored]
    persistLocalReports(nextReports)

    try {
      const body = {
        descripcion: payload.description ?? payload.descripcion,
        tipo_incidente: payload.incidentType,
        latitud: payload.latitude ?? payload.location?.coordinates?.latitude,
        longitud: payload.longitude ?? payload.location?.coordinates?.longitude,
        humo_visible: payload.smokeVisible,
        llamas_visible: payload.flamesVisible,
        personas_en_riesgo: payload.peopleAtRisk,
        explosiones: payload.explosions,
        foto_url: payload.photoUrl ?? payload.foto_url ?? payload.photo,
        id_institucion: payload.id_institucion,
      }

      const result = await apiFetch<any>('/reportes-ciudadanos', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return normalizeReport(result)
    } catch {
      return report
    }
  },

  async getReports(): Promise<CitizenReport[]> {
    try {
      const payload = await apiFetch<any>('/reportes-ciudadanos')
      const items = Array.isArray(payload) ? payload : payload?.data ?? payload?.reportes ?? []
      const reports = items.map(normalizeReport)
      persistLocalReports(reports)
      return reports
    } catch {
      return readLocalReports()
    }
  },

  async getReportById(id: string): Promise<CitizenReport | null> {
    try {
      const payload = await apiFetch<any>(`/reportes-ciudadanos/${id}`)
      return normalizeReport(payload)
    } catch {
      const report = readLocalReports().find((item) => item.id === id)
      return report ?? null
    }
  },
}
