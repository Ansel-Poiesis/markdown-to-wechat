import { computed, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiFormatting } from './useAiFormatting'

describe('AI formatting transaction red team', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function pendingFormatting() {
    const content = ref('原文')
    const documentId = ref('draft-one')
    let complete!: (value: string) => void
    const response = new Promise<string>((resolve) => {
      complete = resolve
    })
    const client = vi.fn(() => response)
    const applyContent = vi.fn((value: string) => {
      content.value = value
    })
    const formatting = useAiFormatting({
      content: computed(() => content.value),
      documentId: computed(() => documentId.value),
      applyContent,
      formatClient: client,
    })
    return { content, documentId, complete, client, applyContent, formatting }
  }

  it('does not replace edits made while a request is pending', async () => {
    const task = pendingFormatting()
    const request = task.formatting.confirmFormat('test-key')
    task.content.value = '正在继续写的正文'
    task.complete('模型对旧原文的排版')
    await request
    expect(task.content.value).toBe('正在继续写的正文')
    expect(task.applyContent).not.toHaveBeenCalled()
  })

  it('discards a late result even if the client ignores cancellation', async () => {
    const task = pendingFormatting()
    const request = task.formatting.confirmFormat('test-key')
    task.formatting.cancelFormat()
    task.complete('迟到的结果')
    await request
    expect(task.content.value).toBe('原文')
    expect(task.applyContent).not.toHaveBeenCalled()
  })

  it('coalesces repeated confirmation while the first request is pending', async () => {
    const task = pendingFormatting()
    const first = task.formatting.confirmFormat('test-key')
    const second = task.formatting.confirmFormat('test-key')
    task.complete('排版结果')
    await Promise.all([first, second])
    expect(task.client).toHaveBeenCalledTimes(1)
    expect(task.applyContent).toHaveBeenCalledTimes(1)
  })
  it('also detects edits that were later reverted to the original text', async () => {
    const task = pendingFormatting()
    const request = task.formatting.confirmFormat('test-key')
    task.content.value = '修改'
    task.content.value = '原文'
    task.complete('对旧快照的结果')
    await request
    expect(task.applyContent).not.toHaveBeenCalled()
  })
  it('discards stale results when switching between drafts with identical content', async () => {
    const task = pendingFormatting()
    const request = task.formatting.confirmFormat('test-key')
    task.documentId.value = 'draft-two'
    task.complete('第一个草稿的排版')
    await request
    expect(task.applyContent).not.toHaveBeenCalled()
    expect(task.formatting.canUndo.value).toBe(false)
  })
  it('invalidates undo history when the active document changes', async () => {
    const task = pendingFormatting()
    task.complete('排版结果')
    await task.formatting.confirmFormat('test-key')
    expect(task.formatting.canUndo.value).toBe(true)
    task.documentId.value = 'draft-two'
    expect(task.formatting.canUndo.value).toBe(false)
  })
})
