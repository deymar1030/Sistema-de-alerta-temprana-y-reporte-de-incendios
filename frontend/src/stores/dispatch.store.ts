import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dispatchService } from '../services/dispatch.service'
import type { Dispatch, DispatchStatus } from '../types'

export const useDispatchStore = defineStore('dispatch', () => {
  const dispatches = ref<Dispatch[]>([])
  const fetchDispatches = async () => { dispatches.value = await dispatchService.getDispatches() }
  const createDispatch = async (input: Omit<Dispatch, 'id' | 'sentAt' | 'updatedAt' | 'status'>) => {
    const dispatch = await dispatchService.createDispatch(input)
    dispatches.value = await dispatchService.getDispatches()
    return dispatch
  }
  const updateStatus = async (id: string, status: DispatchStatus) => {
    await dispatchService.updateStatus(id, status)
    dispatches.value = await dispatchService.getDispatches()
  }
  return { dispatches, fetchDispatches, createDispatch, updateStatus }
})
