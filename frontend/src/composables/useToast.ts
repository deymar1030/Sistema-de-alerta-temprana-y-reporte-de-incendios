import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
}

const toasts = ref<ToastItem[]>([])
let toastCounter = 0

export const useToast = () => {
  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const showToast = (toast: Omit<ToastItem, 'id'>, duration = 3200) => {
    const item: ToastItem = {
      ...toast,
      id: ++toastCounter,
    }

    toasts.value = [...toasts.value, item]
    window.setTimeout(() => removeToast(item.id), duration)
  }

  return {
    toasts,
    showToast,
    removeToast,
  }
}
