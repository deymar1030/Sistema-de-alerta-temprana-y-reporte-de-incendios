import { auditMock } from '../mocks/audit'
import type { AuditLog } from '../types'

export const auditService = {
  async getLogs() { return auditMock },
  async addLog(input: Omit<AuditLog, 'id' | 'fecha'> & { fecha?: string }): Promise<AuditLog> {
    const log: AuditLog = {
      ...input,
      id: `AUD-${String(auditMock.length + 1).padStart(3, '0')}`,
      fecha: input.fecha ?? new Date().toISOString(),
    }
    auditMock.push(log)
    return log
  },
}
