import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComputedRef,
} from 'vue'
import { useUiStore } from '@/stores/ui'
import { mimoFormatStream } from '@/composables/useMimoStream'

interface UseAiFormattingOptions {
  content: ComputedRef<string>
  documentId?: ComputedRef<unknown>
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
  let contentRevision = 0
  watch(
    options.content,
    () => {
      contentRevision += 1
    },
    { flush: 'sync' },
  )
  if (options.documentId) {
    watch(
      options.documentId,
      () => {
        formatAbort?.abort()
        undoSnapshot.value = null
        confirmOpen.value = false
      },
      { flush: 'sync' },
    )
  }

  const requiresApiKey = computed(() => !electronCredentialAvailable.value && !browserApiKey.value)
  const canUndo = computed(() =>
    Boolean(undoSnapshot.value && options.content.value === undoSnapshot.value.formatted),
  )

  if (typeof window !== 'undefined' && getCurrentInstance()) {
    onBeforeUnmount(() => formatAbort?.abort())
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
    if (formatLoading.value) return
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
    if (formatLoading.value) return
    const resolvedKey = apiKey.trim() || browserApiKey.value
    if (!electronCredentialAvailable.value && !resolvedKey) {
      ui.showToast('请先输入 MiMo API Key', 'error')
      return
    }
    const original = options.content.value
    if (!original.trim()) return
    const originalRevision = contentRevision
    confirmOpen.value = false
    formatLoading.value = true
    progressCharacters.value = 0
    const controller = new AbortController()
    formatAbort = controller
    try {
      const formatted = await (options.formatClient || mimoFormatStream)(original, {
        apiKey: resolvedKey,
        signal: controller.signal,
        onChunk: (text) => {
          if (!controller.signal.aborted) progressCharacters.value = text.length
        },
      })
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      if (contentRevision !== originalRevision || options.content.value !== original) {
        ui.showToast('正文已在排版期间修改，保留当前内容，请重新排版', 'info')
        return
      }
      if (!formatted.trim()) throw new Error('辅助排版没有返回有效内容')
      undoSnapshot.value = { original, formatted }
      if (resolvedKey) browserApiKey.value = resolvedKey
      options.applyContent(formatted)
      options.onApplied?.()
      ui.showToast('已完成辅助排版，可撤销', 'success')
    } catch (error: unknown) {
      if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
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
