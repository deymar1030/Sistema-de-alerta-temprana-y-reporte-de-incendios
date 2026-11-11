import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  auditService,
  type SystemAuditEntry,
  type UserAuditEntry,
  type SystemAuditFilters,
  type UserAuditFilters,
} from '../services/audit.service'

export const useAuditStore = defineStore('audit', () => {
  const systemEvents = ref<SystemAuditEntry[]>([])
  const userEvents = ref<UserAuditEntry[]>([])
  const loadingSystem = ref(false)
  const loadingUsers = ref(false)
  const systemError = ref('')
  const usersError = ref('')

  async function fetchSystem(filters: SystemAuditFilters = {}) {
    loadingSystem.value = true
    systemError.value = ''
    try {
      systemEvents.value = await auditService.getSystemEvents(filters)
    } catch (error) {
      systemEvents.value = []
      systemError.value = error instanceof Error ? error.message : 'No se pudieron cargar los eventos.'
    } finally {
      loadingSystem.value = false
    }
  }

  async function fetchUsers(filters: UserAuditFilters = {}) {
    loadingUsers.value = true
    usersError.value = ''
    try {
      userEvents.value = await auditService.getUserEvents(filters)
    } catch (error) {
      userEvents.value = []
      usersError.value = error instanceof Error ? error.message : 'No se pudieron cargar las acciones.'
    } finally {
      loadingUsers.value = false
    }
  }

  function clear() {
    systemEvents.value = []
    userEvents.value = []
    systemError.value = ''
    usersError.value = ''
  }

  return {
    systemEvents, userEvents, loadingSystem, loadingUsers, systemError, usersError,
    fetchSystem, fetchUsers, clear,
  }
})
