import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const activeDialogs: HTMLElement[] = []
const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export function activateModalFocus(dialog: HTMLElement, close: () => void): () => void {
  const previous = document.activeElement as HTMLElement | null
  activeDialogs.push(dialog)
  const isTop = () => activeDialogs.at(-1) === dialog
  const focusable = () =>
    Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (element) => element.getClientRects().length > 0 && !element.closest('[hidden], [inert]'),
    )
  const focusFirst = () => (focusable()[0] || dialog).focus()
  const onKeydown = (event: KeyboardEvent) => {
    if (!isTop()) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopImmediatePropagation()
      close()
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const elements = focusable()
      if (!elements.length) {
        dialog.focus()
        return
      }
      const index = elements.indexOf(document.activeElement as HTMLElement)
      const next = event.shiftKey
        ? index <= 0
          ? elements.length - 1
          : index - 1
        : (index + 1) % elements.length
      elements[next]?.focus()
    }
  }
  const onFocus = (event: FocusEvent) => {
    if (isTop() && !dialog.contains(event.target as Node)) focusFirst()
  }
  document.addEventListener('keydown', onKeydown, true)
  document.addEventListener('focusin', onFocus)
  focusFirst()
  return () => {
    const wasTop = isTop()
    const index = activeDialogs.indexOf(dialog)
    if (index >= 0) activeDialogs.splice(index, 1)
    document.removeEventListener('keydown', onKeydown, true)
    document.removeEventListener('focusin', onFocus)
    if (wasTop && previous?.isConnected) previous.focus({ preventScroll: true })
  }
}

export function useModalFocus(
  open: () => boolean,
  dialog: Ref<HTMLElement | undefined>,
  close: () => void,
) {
  let cleanup: (() => void) | undefined
  watch(
    open,
    async (isOpen, _previous, onCleanup) => {
      cleanup?.()
      cleanup = undefined
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      if (!isOpen) return
      await nextTick()
      if (!cancelled && dialog.value) cleanup = activateModalFocus(dialog.value, close)
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(() => cleanup?.())
}
