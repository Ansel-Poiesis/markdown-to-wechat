import { useUiStore } from '@/stores/ui'

export function useClipboard() {
  const ui = useUiStore()

  async function copyRenderedHtml(html: string) {
    const node = document.createElement('div')
    node.innerHTML = html
    const plain = node.innerText || node.textContent || ''

    try {
      let copied = false
      if (typeof navigator.clipboard?.write === 'function' && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([plain], { type: 'text/plain' }),
            }),
          ])
          copied = true
        } catch {
          // Some browsers reject the async API but still support rich HTML via selection.
        }
      }
      if (!copied) copied = copyUsingSelection(html)
      if (!copied) throw new Error('Rich HTML clipboard is unavailable')
      ui.showToast('已复制，可粘贴到公众号编辑器')
      return true
    } catch {
      ui.showToast('复制失败，请在浏览器权限中允许剪贴板', 'error')
      return false
    }
  }

  return { copyRenderedHtml }
}

function copyUsingSelection(html: string): boolean {
  if (typeof document.execCommand !== 'function') return false
  const selection = window.getSelection()
  if (!selection) return false
  const previousRanges = Array.from({ length: selection.rangeCount }, (_, index) =>
    selection.getRangeAt(index).cloneRange(),
  )
  const previousFocus = document.activeElement as HTMLElement | null
  const copyHost = document.createElement('div')
  copyHost.setAttribute('contenteditable', 'true')
  copyHost.setAttribute('aria-hidden', 'true')
  copyHost.style.position = 'fixed'
  copyHost.style.left = '-9999px'
  copyHost.style.top = '0'
  copyHost.innerHTML = html
  // Keep fallback selection inside an open modal's focus boundary when copying from preflight.
  const copyParent = previousFocus?.closest?.('[role="dialog"]') || document.body
  copyParent.appendChild(copyHost)
  try {
    const range = document.createRange()
    range.selectNodeContents(copyHost)
    selection.removeAllRanges()
    selection.addRange(range)
    return document.execCommand('copy')
  } finally {
    copyHost.remove()
    previousFocus?.focus?.({ preventScroll: true })
    selection.removeAllRanges()
    for (const range of previousRanges) selection.addRange(range)
  }
}
