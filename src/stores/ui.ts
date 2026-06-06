import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ToastItem, ToastType } from '@/types'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  const showSettings = ref(false)
  const activeModals = ref<Record<string, boolean>>({
    draft: false,
    preflight: false,
    themeEditor: false,
    shortcut: false,
  })

  let toastId = 0

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 3000)
  }

  const openModal = (name: string) => {
    activeModals.value[name] = true
    document.body.classList.add('modal-open')
  }

  const closeModal = (name: string) => {
    activeModals.value[name] = false
    const anyOpen = Object.values(activeModals.value).some(Boolean)
    if (!anyOpen) {
      document.body.classList.remove('modal-open')
    }
  }

  const toggleSettings = () => {
    showSettings.value = !showSettings.value
  }

  return {
    toasts,
    showSettings,
    activeModals,
    showToast,
    openModal,
    closeModal,
    toggleSettings,
  }
})
