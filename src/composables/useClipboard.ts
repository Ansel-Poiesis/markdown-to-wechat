import { useUiStore } from '@/stores/ui'

export function useClipboard() {
  const ui = useUiStore()

  async function copyRenderedHtml(html: string) {
    const node = document.createElement('div')
    node.innerHTML = html
    const plain = node.innerText

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ])
      } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
        const copyHost = document.createElement('div')
        copyHost.setAttribute('contenteditable', 'true')
        copyHost.style.position = 'fixed'
        copyHost.style.left = '-9999px'
        copyHost.style.top = '0'
        copyHost.innerHTML = html
        document.body.appendChild(copyHost)
        const range = document.createRange()
        range.selectNodeContents(copyHost)
        const selection = window.getSelection()
        selection?.removeAllRanges()
        selection?.addRange(range)
        document.execCommand('copy')
        selection?.removeAllRanges()
        copyHost.remove()
      } else {
        await navigator.clipboard.writeText(plain)
      }
      ui.showToast('已复制到剪贴板')
      return true
    } catch {
      ui.showToast('复制失败，请在浏览器权限中允许剪贴板', 'error')
      return false
    }
  }

  return { copyRenderedHtml }
}
