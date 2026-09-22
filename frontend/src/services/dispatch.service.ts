import { dispatchesMock } from '../mocks/dispatches'
import type { Dispatch, DispatchStatus } from '../types'

export const dispatchService = {
  async getDispatches() { return dispatchesMock },
  async createDispatch(input: Omit<Dispatch, 'id' | 'sentAt' | 'updatedAt' | 'status'>): Promise<Dispatch> {
    const now = new Date().toISOString()
    const dispatch: Dispatch = {
      ...input,
      id: `DSP-${String(dispatchesMock.length + 1).padStart(3, '0')}`,
      sentAt: now,
      updatedAt: now,
      status: 'ENVIADA',
    }
    dispatchesMock.push(dispatch)
    return dispatch
  },
  async updateStatus(id: string, status: DispatchStatus) {
    const dispatch = dispatchesMock.find((item) => item.id === id)
    if (dispatch) {
      dispatch.status = status
      dispatch.updatedAt = new Date().toISOString()
    }
    return dispatch
  },
}
