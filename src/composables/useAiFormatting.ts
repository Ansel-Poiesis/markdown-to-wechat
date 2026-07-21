import { computed, getCurrentInstance, onMounted, ref, type ComputedRef } from 'vue'
import { useUiStore } from '@/stores/ui'
import { mimoFormatStream } from '@/composables/useMimoStream'

interface UseAiFormattingOptions {
  content: ComputedRef<string>
  applyContent: (value: string) => void
  onApplied?: () => void
  onUndone?: () => void
  formatClient?: typeof mimoFormatStream
}

interface UndoSnapshot {
  original: string
  formatted: string
}

export function useAiFormatting(options: UseAiFormattingOptions) {
  const ui = useUiStore()
  const confirmOpen = ref(false)
  const formatLoading = ref(false)
  const electronCredentialAvailable = ref(false)
  const browserApiKey = ref('')
  const progressCharacters = ref(0)
  const undoSnapshot = ref<UndoSnapshot | null>(null)
  let formatAbort: AbortController | null = null

  const requiresApiKey = computed(
    () => !electronCredentialAvailable.value && !browserApiKey.value,
  )
  const canUndo = computed(
    () => Boolean(undoSnapshot.value && options.content.value === undoSnapshot.value.formatted),
  )

  if (typeof window !== 'undefined' && getCurrentInstance()) {
    onMounted(async () => {
      if (!window.electronAPI?.getMimoStatus) return
      try {
        const status = await window.electronAPI.getMimoStatus()
        electronCredentialAvailable.value = status.configured
      } catch {
        electronCredentialAvailable.value = false
      }
    })
  }

  function requestFormat() {
    if (!options.content.value.trim()) {
      ui.showToast('请先输入需要排版的内容', 'error')
      return
    }
    confirmOpen.value = true
  }

  function closeConfirm() {
    if (!formatLoading.value) confirmOpen.value = false
  }

  async function confirmFormat(apiKey = '') {
    const resolvedKey = apiKey.trim() || browserApiKey.value
    if (!electronCredentialAvailable.value && !resolvedKey) {
      ui.showToast('请先输入 MiMo API Key', 'error')
      return
    }
    const original = options.content.value
    confirmOpen.value = false
    formatLoading.value = true
    progressCharacters.value = 0
    formatAbort = new AbortController()
    try {
      const formatted = await (options.formatClient || mimoFormatStream)(original, {
        apiKey: resolvedKey,
        signal: formatAbort.signal,
        onChunk: (text) => {
          progressCharacters.value = text.length
        },
      })
      undoSnapshot.value = { original, formatted }
      if (resolvedKey) browserApiKey.value = resolvedKey
      options.applyContent(formatted)
      options.onApplied?.()
      ui.showToast('已完成辅助排版，可撤销', 'success')
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        ui.showToast('已取消排版，原文未改动', 'info')
      } else {
        const message = error instanceof Error ? error.message : '排版服务异常'
        if (/\b(401|403)\b/.test(message)) browserApiKey.value = ''
        ui.showToast(message, 'error')
      }
    } finally {
      formatLoading.value = false
      formatAbort = null
    }
  }

  function cancelFormat() {
    formatAbort?.abort()
  }

  function undoFormat() {
    const snapshot = undoSnapshot.value
    if (!snapshot || options.content.value !== snapshot.formatted) {
      undoSnapshot.value = null
      ui.showToast('正文已继续修改，无法安全撤销排版', 'error')
      return
    }
    options.applyContent(snapshot.original)
    undoSnapshot.value = null
    options.onUndone?.()
    ui.showToast('已撤销辅助排版', 'info')
  }

  return {
    confirmOpen,
    formatLoading,
    progressCharacters,
    requiresApiKey,
    canUndo,
    requestFormat,
    closeConfirm,
    confirmFormat,
    cancelFormat,
    undoFormat,
  }
}
