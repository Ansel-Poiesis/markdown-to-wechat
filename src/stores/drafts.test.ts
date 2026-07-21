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
})
