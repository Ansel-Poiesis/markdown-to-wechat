import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'

const directory = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(directory, 'main.cjs'), 'utf8')
const realRequire = createRequire(import.meta.url)
const stream = 'data: {"choices":[{"delta":{"content":"正文"},"finish_reason":"stop"}]}\n'
const request = {
  requestId: 'audit-123',
  content: '原文',
  model: 'mimo-v2.5',
  systemPrompt: '排版',
  maxCompletionTokens: 4000,
  temperature: 0.2,
  reasoningEffort: 'low',
}

function harness(body = stream) {
  const handles = new Map()
  const events = new Map()
  const windowEvents = new Map()
  const openExternal = vi.fn(async () => undefined)
  const fetch = vi.fn(async () => new Response(body))
  const webContents = {
    mainFrame: { url: pathToFileURL(join(directory, '../dist/index.html')).href },
    getURL() {
      return this.mainFrame.url
    },
    isDestroyed: () => false,
    send: vi.fn(),
    setWindowOpenHandler: vi.fn(),
    on: (name, handler) => windowEvents.set(name, handler),
  }
  class BrowserWindow {
    webContents = webContents
    loadFile() {}
    on() {}
  }
  const electron = {
    // oxlint-disable-next-line unicorn/no-thenable -- Synchronous Electron lifecycle mock.
    app: { whenReady: () => ({ then: (callback) => callback() }), on() {} },
    BrowserWindow,
    ipcMain: {
      handle: (name, handler) => handles.set(name, handler),
      on: (name, handler) => events.set(name, handler),
    },
    shell: { openExternal },
  }
  runInNewContext(source, {
    require: (name) => (name === 'electron' ? electron : realRequire(name)),
    __dirname: directory,
    process: { env: { MIMO_API_KEY: 'mock-key' }, platform: 'win32' },
    URL,
    AbortController,
    TextDecoder,
    DOMException,
    setTimeout,
    clearTimeout,
    fetch,
  })
  return {
    handles,
    events,
    windowEvents,
    fetch,
    openExternal,
    webContents,
    trusted: { sender: webContents, senderFrame: webContents.mainFrame },
  }
}

describe('Electron trust boundary red team (mock OS/network)', () => {
  afterEach(() => vi.useRealTimers())
  it('rejects IPC from an unrelated webContents', async () => {
    const app = harness()
    await expect(
      app.handles.get('mimo:format')(
        {
          sender: { isDestroyed: () => false, send() {} },
          senderFrame: { url: 'https://attacker.invalid' },
        },
        request,
      ),
    ).rejects.toThrow()
    expect(app.fetch).not.toHaveBeenCalled()
  })
  it('rejects privileged status requests from a subframe', () => {
    const app = harness()
    expect(() =>
      app.handles.get('mimo:status')({
        sender: app.webContents,
        senderFrame: { url: app.webContents.getURL() },
      }),
    ).toThrow()
  })
  it('rejects mailto recipient injection through query headers', async () => {
    const app = harness()
    await expect(
      app.handles.get('feedback:open-email')(
        app.trusted,
        'mailto:callansel@agent.qq.com?bcc=attacker@example.com&subject=hi&body=private',
      ),
    ).rejects.toThrow()
    expect(app.openExternal).not.toHaveBeenCalled()
  })
  it('allows only subject/body on the fixed feedback recipient', async () => {
    const app = harness()
    await app.handles.get('feedback:open-email')(
      app.trusted,
      'mailto:callansel@agent.qq.com?subject=feedback&body=hello',
    )
    expect(app.openExternal).toHaveBeenCalledOnce()
  })
  it('bounds model cost parameters before calling the provider', async () => {
    const app = harness()
    await expect(
      app.handles.get('mimo:format')(app.trusted, { ...request, maxCompletionTokens: 1_000_000 }),
    ).rejects.toThrow()
    expect(app.fetch).not.toHaveBeenCalled()
  })
  it('rejects endpoint credentials and nonstandard ports', async () => {
    const app = harness()
    await expect(
      app.handles.get('mimo:format')(app.trusted, {
        ...request,
        endpoint: 'https://api.xiaomimimo.com:8443/v1/chat/completions',
      }),
    ).rejects.toThrow()
    expect(app.fetch).not.toHaveBeenCalled()
  })
  it('does not forward API credentials through redirects', async () => {
    const app = harness()
    expect(await app.handles.get('mimo:format')(app.trusted, request)).toBe('正文')
    expect(app.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: 'error', credentials: 'omit' }),
    )
  })
  it('rejects a malformed partial stream followed by DONE', async () => {
    const app = harness(
      'data: {"choices":[{"delta":{"content":"正文"}}]}\ndata: broken\ndata: [DONE]\n',
    )
    await expect(app.handles.get('mimo:format')(app.trusted, request)).rejects.toThrow()
  })
  it('times out a stalled request and accepts the next request after cleanup', async () => {
    vi.useFakeTimers()
    const app = harness()
    app.fetch.mockImplementationOnce(() => new Promise(() => {}))
    const result = expect(app.handles.get('mimo:format')(app.trusted, request)).rejects.toThrow(
      '超时',
    )
    await vi.advanceTimersByTimeAsync(120_001)
    await result
    expect(vi.getTimerCount()).toBe(0)
    expect(await app.handles.get('mimo:format')(app.trusted, request)).toBe('正文')
  })
  it('prevents concurrent spending and allows only the trusted frame to cancel', async () => {
    const app = harness()
    app.fetch.mockImplementationOnce(() => new Promise(() => {}))
    const pending = app.handles.get('mimo:format')(app.trusted, request)
    const rejected = expect(pending).rejects.toThrow('Aborted')
    await expect(
      app.handles.get('mimo:format')(app.trusted, { ...request, requestId: 'second' }),
    ).rejects.toThrow('进行中')
    const signal = app.fetch.mock.calls[0][1].signal
    app.events.get('mimo:cancel')(
      { sender: app.webContents, senderFrame: { url: app.webContents.getURL() } },
      request.requestId,
    )
    expect(signal.aborted).toBe(false)
    app.events.get('mimo:cancel')(app.trusted, request.requestId)
    await rejected
    expect(signal.aborted).toBe(true)
    expect(await app.handles.get('mimo:format')(app.trusted, request)).toBe('正文')
  })
  it('blocks top-level navigation and redirect away from the packaged renderer', () => {
    const app = harness()
    for (const type of ['will-navigate', 'will-redirect']) {
      const preventDefault = vi.fn()
      app.windowEvents.get(type)({ preventDefault }, 'https://attacker.invalid/')
      expect(preventDefault).toHaveBeenCalledOnce()
    }
  })
  it.each([
    'mailto:callansel@agent.qq.com?subject=ok%0D%0ABcc%3Aattacker%40example.com',
    'mailto:callansel@agent.qq.com?subject=one&subject=two',
    'mailto:attacker@example.com?body=private',
  ])('rejects alternate mail recipient/header ambiguity: %s', async (mailto) => {
    const app = harness()
    await expect(app.handles.get('feedback:open-email')(app.trusted, mailto)).rejects.toThrow()
    expect(app.openExternal).not.toHaveBeenCalled()
  })
})
