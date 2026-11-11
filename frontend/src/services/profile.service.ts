import { apiFetch } from './http'

/** No permite enviar rol, institucion, estado, password ni otros privilegios. */
export interface OwnProfileChanges {
  nombre?: string
  primer_apellido?: string
  segundo_apellido?: string
  correo?: string
  telefono?: string
}

const ALLOWED_FIELDS: ReadonlyArray<keyof OwnProfileChanges> = [
  'nombre', 'primer_apellido', 'segundo_apellido', 'correo', 'telefono',
]

export const profileService = {
  async updateOwnProfile(currentUserId: string, changes: OwnProfileChanges): Promise<void> {
    if (!currentUserId) throw new Error('La sesion no tiene un identificador valido.')
    const safe: OwnProfileChanges = {}
    for (const key of ALLOWED_FIELDS) {
      const value = changes[key]
      if (typeof value === 'string') safe[key] = value.trim()
    }
    if (!Object.keys(safe).length) return

    // Es la ruta existente de edicion de usuarios. El servidor debe validar
    // que la sesion puede editar esta cuenta. Nunca eludimos un HTTP 403.
    await apiFetch(`/usuarios/${encodeURIComponent(currentUserId)}`, {
      method: 'PUT',
      body: JSON.stringify(safe),
    })
  },
}