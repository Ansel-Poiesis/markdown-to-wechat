import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDraftStore } from '@/stores/drafts'

describe('draft store', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    })
    setActivePinia(createPinia())
  })

  it('persists clearing the active draft', () => {
    const store = useDraftStore()
    store.loadDrafts()
    store.createDraft('原文')
    store.updateActiveDraft('')

    expect(store.activeDraft?.content).toBe('')
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')[0].content).toBe('')
  })

  it('creates the welcome text as a regular persisted draft on first open', () => {
    const store = useDraftStore()
    const welcome = '# 欢迎仪式\n\n这是首次打开的欢迎文本。'

    expect(store.initializeWorkspace('', welcome)).toBe(welcome)
    expect(store.activeDraft?.name).toBe('欢迎仪式')
    expect(store.activeDraft?.content).toBe(welcome)
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')).toHaveLength(1)
  })

  it('auto-saves edits and restores the active draft after reloading', () => {
    const store = useDraftStore()
    store.initializeWorkspace('', '# 欢迎仪式')
    store.updateActiveDraft('# 正在写的新文章\n\n已经保存。')

    setActivePinia(createPinia())
    const restoredStore = useDraftStore()
    const restored = restoredStore.initializeWorkspace('', '# 不应覆盖已有内容')

    expect(restored).toContain('正在写的新文章')
    expect(restoredStore.activeDraft?.name).toBe('正在写的新文章')
    expect(restoredStore.activeDraft?.content).toContain('已经保存。')
  })

  it('promotes an existing editor workspace to a normal draft without replacing it', () => {
    const store = useDraftStore()
    const existing = '# 旧工作区文章\n\n继续写作。'

    expect(store.initializeWorkspace(existing, '# 欢迎仪式')).toBe(existing)
    expect(store.activeDraft?.name).toBe('旧工作区文章')
    expect(store.activeDraft?.content).toBe(existing)
  })

  it('keeps the active draft first while sorting the remaining drafts by update time', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const oldest = store.createDraft('# 最早草稿')
    const middle = store.createDraft('# 中间草稿')
    const latest = store.createDraft('# 最新草稿')

    oldest.updatedAt = '2026-07-19T00:00:00.000Z'
    middle.updatedAt = '2026-07-20T00:00:00.000Z'
    latest.updatedAt = '2026-07-21T00:00:00.000Z'
    store.setActiveDraft(oldest.id)

    expect(store.sortedDrafts.map((draft) => draft.id)).toEqual([
      oldest.id,
      latest.id,
      middle.id,
    ])
  })

  it('restores the active draft at the top after reloading', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const active = store.createDraft('# 要继续写的草稿')
    const newer = store.createDraft('# 稍后创建的草稿')
    store.setActiveDraft(active.id)

    expect(newer.id).not.toBe(active.id)

    setActivePinia(createPinia())
    const restoredStore = useDraftStore()
    restoredStore.loadDrafts()

    expect(restoredStore.activeDraftId).toBe(active.id)
    expect(restoredStore.sortedDrafts[0]?.id).toBe(active.id)
  })
})
