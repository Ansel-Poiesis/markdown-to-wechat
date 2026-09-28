import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useClipboard } from '@/composables/useClipboard'

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('@/stores/ui', () => ({ useUiStore: () => ({ showToast }) }))

function stubClipboardDom() {
  const savedRange = { saved: true }
  const selection = {
    rangeCount: 1,
    getRangeAt: vi.fn(() => ({ cloneRange: () => savedRange })),
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
  }
  const focus = vi.fn()
  const hosts: { remove: ReturnType<typeof vi.fn> }[] = []
  const command = vi.fn(() => true)
  vi.stubGlobal('window', { getSelection: () => selection })
  vi.stubGlobal('navigator', {})
  vi.stubGlobal('document', {
    createElement: () => {
      const node = {
        innerHTML: '',
        innerText: '',
        textContent: '正文',
        style: {},
        setAttribute: vi.fn(),
        remove: vi.fn(),
      }
      hosts.push(node)
      return node
    },
    activeElement: { focus },
    body: { appendChild: vi.fn() },
    createRange: () => ({ selectNodeContents: vi.fn() }),
    execCommand: command,
  })
  return { command, hosts, selection, savedRange, focus }
}

describe('rich HTML clipboard reliability', () => {
  beforeEach(() => showToast.mockClear())
  afterEach(() => vi.unstubAllGlobals())

  it('does not report success when execCommand returns false', async () => {
    const dom = stubClipboardDom()
    dom.command.mockReturnValue(false)
    expect(await useClipboard().copyRenderedHtml('<p>正文</p>')).toBe(false)
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('复制失败'), 'error')
    expect(dom.hosts[1]?.remove).toHaveBeenCalled()
    expect(dom.selection.addRange).toHaveBeenLastCalledWith(dom.savedRange)
    expect(dom.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('cleans up the temporary editable host and restores selection after a thrown command', async () => {
    const dom = stubClipboardDom()
    dom.command.mockImplementation(() => {
      throw new Error('Permission denied')
    })
    expect(await useClipboard().copyRenderedHtml('<p>正文</p>')).toBe(false)
    expect(dom.hosts[1]?.remove).toHaveBeenCalled()
    expect(dom.selection.addRange).toHaveBeenLastCalledWith(dom.savedRange)
  })

  it('falls back to rich HTML selection if the async clipboard API rejects', async () => {
    const dom = stubClipboardDom()
    const write = vi.fn().mockRejectedValue(new Error('Permission denied'))
    class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    }
    vi.stubGlobal('ClipboardItem', MockClipboardItem)
    Object.assign(window, { ClipboardItem: MockClipboardItem })
    vi.stubGlobal('navigator', { clipboard: { write } })
    expect(await useClipboard().copyRenderedHtml('<p>正文</p>')).toBe(true)
    expect(write).toHaveBeenCalledOnce()
    expect(dom.command).toHaveBeenCalledWith('copy')
    expect(showToast).toHaveBeenCalledWith('已复制，可粘贴到公众号编辑器')
  })

  it('writes both MIME types with the async API without changing the selection', async () => {
    const dom = stubClipboardDom()
    const write = vi.fn().mockResolvedValue(undefined)
    class MockClipboardItem {
      constructor(public data: Record<string, Blob>) {}
    }
    vi.stubGlobal('ClipboardItem', MockClipboardItem)
    Object.assign(window, { ClipboardItem: MockClipboardItem })
    vi.stubGlobal('navigator', { clipboard: { write } })
    expect(await useClipboard().copyRenderedHtml('<p>正文</p>')).toBe(true)
    const item = write.mock.calls[0]?.[0][0] as MockClipboardItem
    expect(await item.data['text/html']?.text()).toBe('<p>正文</p>')
    expect(await item.data['text/plain']?.text()).toBe('正文')
    expect(dom.command).not.toHaveBeenCalled()
    expect(dom.selection.removeAllRanges).not.toHaveBeenCalled()
  })

  it('does not silently substitute plain text when rich HTML copying is unavailable', async () => {
    stubClipboardDom()
    Object.assign(document, { execCommand: undefined })
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await useClipboard().copyRenderedHtml('<p>正文</p>')).toBe(false)
    expect(writeText).not.toHaveBeenCalled()
  })
})
