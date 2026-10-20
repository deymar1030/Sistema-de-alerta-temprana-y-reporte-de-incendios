import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auditService } from '../services/audit.service'
import type { AuditLog } from '../types'

export const useAuditStore = defineStore('audit', () => {
  const logs = ref<AuditLog[]>([])
  const fetchLogs = async () => { logs.value = await auditService.getLogs() }
  const addLog = async (input: Omit<AuditLog, 'id' | 'fecha'> & { fecha?: string }) => {
    const log = await auditService.addLog(input)
    logs.value = await auditService.getLogs()
    return log
  }
  return { logs, fetchLogs, addLog }
})
