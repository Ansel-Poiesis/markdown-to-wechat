import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDraftStore } from '@/stores/drafts'
import { useEditorStore, type WorkspaceBackup } from '@/stores/editor'

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

  it('migrates the former welcome heading without replacing edited body content', () => {
    const id = 7
    localStorage.setItem(
      'wechat-md-drafts',
      JSON.stringify([
        {
          id,
          name: '欢迎仪式：把 Markdown 变成公众号文章',
          content: '# 欢迎仪式：把 Markdown 变成公众号文章\n\n保留这段已经编辑的正文。',
          createdAt: '2026-07-20T00:00:00.000Z',
          updatedAt: '2026-07-21T00:00:00.000Z',
        },
      ]),
    )
    localStorage.setItem('wechat-md-active-draft-id', String(id))

    const store = useDraftStore()
    const restored = store.initializeWorkspace('', '# 新欢迎稿')

    expect(restored).toBe('# 把 Markdown 变成公众号文章\n\n保留这段已经编辑的正文。')
    expect(store.activeDraft?.name).toBe('把 Markdown 变成公众号文章')
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')[0].content).toBe(restored)
  })

  it('migrates the legacy editor workspace before saving it as a draft', () => {
    const store = useDraftStore()
    const restored = store.initializeWorkspace(
      '# 欢迎仪式：把 Markdown 变成公众号文章\n\n旧编辑区正文。',
      '# 新欢迎稿',
    )

    expect(restored).toBe('# 把 Markdown 变成公众号文章\n\n旧编辑区正文。')
    expect(store.activeDraft?.content).toBe(restored)
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

    expect(store.sortedDrafts.map((draft) => draft.id)).toEqual([oldest.id, latest.id, middle.id])
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

  it('reports local storage write failures instead of claiming the draft was saved', () => {
    const store = useDraftStore()
    store.loadDrafts()
    store.createDraft('# 初稿')
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    const saved = store.updateActiveDraft('# 无法持久化的改动')

    expect(saved).toBe(false)
    expect(store.persistenceError).toContain('草稿未能写入本地存储')
  })

  it('retries the same content after a failed save instead of claiming success without writing', () => {
    const store = useDraftStore()
    store.loadDrafts()
    store.createDraft('# 初稿')
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    expect(store.updateActiveDraft('# 尚未落盘')).toBe(false)
    expect(store.updateActiveDraft('# 尚未落盘')).toBe(true)
    expect(write).toHaveBeenCalledTimes(3)
    expect(store.persistenceError).toBeNull()
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')[0].content).toBe(
      '# 尚未落盘',
    )
  })

  it.each(['{"broken":', '{"unexpected":"shape"}', '[{"id":1,"content":"原稿"}]'])(
    'preserves malformed archives instead of silently replacing them: %s',
    (original) => {
      localStorage.setItem('wechat-md-drafts', original)
      localStorage.setItem('wechat-md-active-draft-id', '7')
      const store = useDraftStore()
      store.initializeWorkspace('# 编辑区备份', '# 欢迎稿')
      store.updateActiveDraft('# 本次修改')
      store.saveDrafts()
      expect(localStorage.getItem('wechat-md-drafts')).toBe(original)
      expect(localStorage.getItem('wechat-md-active-draft-id')).toBe('7')
      expect(store.persistenceError).toContain('已保留原存储且暂停覆盖')
      expect(store.activeDraft?.content).toBe('# 本次修改')
    },
  )

  it('does not hide an unsaved archive when switching active drafts', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const original = store.createDraft('# 原草稿')
    store.createDraft('# 新草稿')
    const originalWrite = localStorage.setItem.bind(localStorage)
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'wechat-md-drafts') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      originalWrite(key, value)
    })
    store.updateActiveDraft('# 尚未保存的修改')
    store.setActiveDraft(original.id)
    expect(store.persistenceError).toContain('草稿未能写入本地存储')
  })

  it('recovers a newer identified backup after archive quota failure and a full store reload', () => {
    const drafts = useDraftStore()
    drafts.initializeWorkspace('', '# 已保存原稿')
    const editor = useEditorStore()
    editor.setContent('# 已保存原稿')
    const originalWrite = localStorage.setItem.bind(localStorage)
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === 'wechat-md-drafts') throw new DOMException('Quota exceeded', 'QuotaExceededError')
      originalWrite(key, value)
    })
    editor.setContent('# 配额失败后仍须恢复的修改')
    expect(drafts.updateActiveDraft(editor.content)).toBe(false)
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')[0].content).toBe(
      '# 已保存原稿',
    )

    setActivePinia(createPinia())
    const restoredEditor = useEditorStore()
    const restoredDrafts = useDraftStore()
    expect(
      restoredDrafts.initializeWorkspace(
        restoredEditor.content,
        '# 欢迎稿',
        restoredEditor.recovery,
      ),
    ).toBe('# 配额失败后仍须恢复的修改')
    expect(restoredDrafts.activeDraft?.content).toBe('# 配额失败后仍须恢复的修改')
    expect(restoredDrafts.persistenceError).not.toBeNull()
    write.mockRestore()
    expect(restoredDrafts.saveDrafts()).toBe(true)
    expect(JSON.parse(localStorage.getItem('wechat-md-drafts') || '[]')[0].content).toBe(
      '# 配额失败后仍须恢复的修改',
    )
  })

  it('restores only the identified draft without overwriting another selected draft', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const original = store.createDraft('# 需要恢复的旧稿')
    const other = store.createDraft('# 不应被覆盖的稿件')
    const backup: WorkspaceBackup = {
      version: 1,
      draftId: original.id,
      content: '# 需要恢复的新稿',
      updatedAt: new Date(Date.parse(original.updatedAt) + 1000).toISOString(),
    }
    expect(store.initializeWorkspace(backup.content, '# 欢迎稿', backup)).toBe(backup.content)
    expect(store.drafts.find((draft) => draft.id === other.id)?.content).toBe('# 不应被覆盖的稿件')
    expect(store.activeDraftId).toBe(original.id)
  })

  it('does not use an older recovery snapshot or an unidentified legacy string to replace an archived draft', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const current = store.createDraft('# 新版归档')
    const backup: WorkspaceBackup = {
      version: 1,
      draftId: current.id,
      content: '# 陈旧备份',
      updatedAt: new Date(Date.parse(current.updatedAt) - 1000).toISOString(),
    }
    expect(store.initializeWorkspace(backup.content, '# 欢迎稿', backup)).toBe('# 新版归档')
    expect(store.initializeWorkspace('# 不知所属的旧备份', '# 欢迎稿')).toBe('# 新版归档')
  })

  it('preserves a new draft whose archive write never succeeded as a separate recovered draft', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const existing = store.createDraft('# 原有稿件')
    const backup: WorkspaceBackup = {
      version: 1,
      draftId: existing.id + 5,
      content: '# 未入档新稿',
      updatedAt: new Date().toISOString(),
    }
    expect(store.initializeWorkspace(backup.content, '# 欢迎稿', backup)).toBe(backup.content)
    expect(store.drafts.find((draft) => draft.id === existing.id)?.content).toBe('# 原有稿件')
    expect(store.activeDraft?.name).toBe('恢复：未入档新稿')
  })

  it('bounds title inference for adversarial long lines without truncating the stored article', () => {
    const store = useDraftStore()
    store.loadDrafts()
    const source = '['.repeat(200_000)
    const start = performance.now()
    const draft = store.createDraft(source)
    expect(performance.now() - start).toBeLessThan(500)
    expect(draft.content).toBe(source)
    expect(draft.name).toBe('未命名草稿')
  })
})
