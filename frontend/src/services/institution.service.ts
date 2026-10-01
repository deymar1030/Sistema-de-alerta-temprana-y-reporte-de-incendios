import { institutionsMock } from '../mocks/institutions'
import type { Institution } from '../types'

export const institutionService = {
  async getInstitutions(): Promise<Institution[]> { return institutionsMock },
  async getNearby(): Promise<Institution[]> { return institutionsMock.filter((institution) => institution.estado === 'ACTIVA') },
}