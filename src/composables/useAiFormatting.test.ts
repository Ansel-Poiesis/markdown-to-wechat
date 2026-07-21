import { computed, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiFormatting } from '@/composables/useAiFormatting'

describe('useAiFormatting', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('applies a complete result once and restores the original on undo', async () => {
    const content = ref('原文')
    const applyContent = vi.fn((value: string) => {
      content.value = value
    })
    const formatting = useAiFormatting({
      content: computed(() => content.value),
      applyContent,
      formatClient: vi.fn(async (_source, options) => {
        options.onChunk('排版后')
        return '排版后'
      }),
    })

    await formatting.confirmFormat('test-key')
    expect(applyContent).toHaveBeenCalledTimes(1)
    expect(content.value).toBe('排版后')
    expect(formatting.canUndo.value).toBe(true)

    formatting.undoFormat()
    expect(content.value).toBe('原文')
    expect(formatting.canUndo.value).toBe(false)
  })

  it('keeps the original content when formatting fails', async () => {
    const content = ref('原文')
    const applyContent = vi.fn()
    const formatting = useAiFormatting({
      content: computed(() => content.value),
      applyContent,
      formatClient: vi.fn(async () => {
        throw new Error('响应未完整结束')
      }),
    })

    await formatting.confirmFormat('test-key')
    expect(applyContent).not.toHaveBeenCalled()
    expect(content.value).toBe('原文')
    expect(formatting.canUndo.value).toBe(false)
  })
})
