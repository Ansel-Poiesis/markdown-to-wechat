import { afterEach, describe, expect, it, vi } from 'vitest'
import { mimoFormatStream, parseSSELine } from '@/composables/useMimoStream'

describe('parseSSELine', () => {
  it('ignores Token Plan reasoning chunks', () => {
    const line = 'data: {"choices":[{"delta":{"reasoning_content":"分析中","content":""}}]}'
    expect(parseSSELine(line, '')).toBe('')
  })

  it('appends final Markdown content chunks', () => {
    const first = 'data: {"choices":[{"delta":{"content":"## 标题"}}]}'
    const second = 'data: {"choices":[{"delta":{"content":"\\n\\n正文"}}]}'
    expect(parseSSELine(second, parseSSELine(first, ''))).toBe('## 标题\n\n正文')
  })
})

describe('mimoFormatStream', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns content only after the stream reports a complete stop', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          'data: {"choices":[{"delta":{"content":"## 标题"}}]}\n' +
            'data: {"choices":[{"delta":{"content":"\\n正文"},"finish_reason":"stop"}]}\n',
          { status: 200 },
        ),
      ),
    )
    const chunks: string[] = []

    const result = await mimoFormatStream('原文', {
      apiKey: 'test-key',
      onChunk: (text) => chunks.push(text),
    })

    expect(result).toBe('## 标题\n正文')
    expect(chunks.at(-1)).toBe(result)
  })

  it('rejects an interrupted stream instead of returning partial output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('data: {"choices":[{"delta":{"content":"半截结果"}}]}\n', { status: 200 }),
      ),
    )

    await expect(
      mimoFormatStream('原文', { apiKey: 'test-key', onChunk: () => undefined }),
    ).rejects.toThrow('响应未完整结束')
  })

  it('rejects length-truncated output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          'data: {"choices":[{"delta":{"content":"半截结果"},"finish_reason":"length"}]}\n',
          { status: 200 },
        ),
      ),
    )

    await expect(
      mimoFormatStream('原文', { apiKey: 'test-key', onChunk: () => undefined }),
    ).rejects.toThrow('模型截断')
  })
})
