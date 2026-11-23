import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  // danger: acciones destructivas (eliminar, desactivar, cerrar una alerta).
  tone?: 'primary' | 'danger'
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (accepted: boolean) => void
}

// Una sola confirmacion a la vez, mostrada por <ConfirmDialog /> en App.vue.
// Reemplaza a window.confirm, que muestra el cuadro nativo del navegador.
const current = ref<ConfirmRequest | null>(null)

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      current.value?.resolve(false)
      current.value = { ...options, resolve }
    })

  const settle = (accepted: boolean) => {
    const request = current.value
    current.value = null
    request?.resolve(accepted)
  }

  return { current, confirm, settle }
}
