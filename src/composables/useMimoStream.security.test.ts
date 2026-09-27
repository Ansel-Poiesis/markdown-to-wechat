import { afterEach, describe, expect, it, vi } from 'vitest'
import { mimoFormatStream } from './useMimoStream'

const streamOptions = { apiKey: 'test-key', onChunk: () => undefined }
const goodChunk = 'data: {"choices":[{"delta":{"content":"正文"}}]}\n'
describe('MiMo stream red team (mock network only)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not send a pre-aborted request through Electron', async () => {
    const formatMimo = vi.fn(async () => '正文')
    vi.stubGlobal('window', { electronAPI: { formatMimo, cancelMimo: vi.fn() } })
    const controller = new AbortController()
    controller.abort()
    await expect(
      mimoFormatStream('原文', { ...streamOptions, signal: controller.signal }),
    ).rejects.toThrow()
    expect(formatMimo).not.toHaveBeenCalled()
  })
  it('uses an explicitly supplied session key when the desktop has no system credential', async () => {
    const formatMimo = vi.fn(async () => {
      throw new Error('当前系统未配置 MIMO_API_KEY')
    })
    vi.stubGlobal('window', { electronAPI: { formatMimo, cancelMimo: vi.fn() } })
    const fetch = vi.fn(async () => new Response(goodChunk + 'data: [DONE]\n'))
    vi.stubGlobal('fetch', fetch)
    expect(await mimoFormatStream('原文', streamOptions)).toBe('正文')
    expect(formatMimo).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it.each([
    goodChunk + 'data: {invalid JSON}\ndata: [DONE]\n',
    goodChunk + 'data: {"choices":[{"delta":{},"finish_reason":"content_filter"}]}\ndata: [DONE]\n',
    'data: {"choices":[{"delta":{"content":{"html":"not text"}}}]}\ndata: [DONE]\n',
  ])('rejects corrupt or filtered responses instead of applying partial output', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body)),
    )
    await expect(mimoFormatStream('原文', streamOptions)).rejects.toThrow()
  })

  it('does not follow API redirects with an API credential', async () => {
    const request = vi.fn(async () => new Response(goodChunk + 'data: [DONE]\n'))
    vi.stubGlobal('fetch', request)
    await mimoFormatStream('原文', streamOptions)
    expect(request).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: 'error', credentials: 'omit' }),
    )
  })

  it('cancels a completed stream without waiting for the server to close it', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(goodChunk + 'data: [DONE]\n'))
      },
      cancel,
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body)),
    )
    expect(await mimoFormatStream('原文', streamOptions)).toBe('正文')
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('does not apply a completed chunk if cancellation happens in its progress callback', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(goodChunk + 'data: [DONE]\n')),
    )
    await expect(
      mimoFormatStream('原文', {
        ...streamOptions,
        signal: controller.signal,
        onChunk: () => controller.abort(),
      }),
    ).rejects.toThrow()
  })

  it('times out a stalled body and releases its reader', async () => {
    vi.useFakeTimers()
    const cancel = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new ReadableStream({ cancel }))),
    )
    const result = expect(mimoFormatStream('原文', streamOptions)).rejects.toThrow('超时')
    await vi.advanceTimersByTimeAsync(120_001)
    await result
    expect(cancel).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves Chinese and emoji split at every UTF-8 byte boundary', async () => {
    const expected = '中文🧪排版'
    const bytes = new TextEncoder().encode(
      `data: ${JSON.stringify({ choices: [{ delta: { content: expected }, finish_reason: 'stop' }] })}\n`,
    )
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(Uint8Array.of(byte))
        controller.close()
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body)),
    )
    expect(await mimoFormatStream('原文', streamOptions)).toBe(expected)
  })

  it.each([
    ['unterminated event', 'data: ' + 'x'.repeat(256_001)],
    [
      'unbounded output',
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'x'.repeat(200_000) } }] })}\n`.repeat(
        6,
      ),
    ],
    ['oversized transport', ':'.repeat(8_000_001)],
  ])('bounds hostile %s data', async (_label, body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(body)),
    )
    await expect(mimoFormatStream('原文', streamOptions)).rejects.toThrow(/过长|过大/)
  })
})
