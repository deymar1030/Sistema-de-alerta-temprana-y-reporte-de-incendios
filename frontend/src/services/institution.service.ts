import { institutionsMock } from '../mocks/institutions'

export const institutionService = {
  async getInstitutions() { return institutionsMock },
  async getNearby() { return institutionsMock.filter((institution) => institution.estado === 'ACTIVA') },
}