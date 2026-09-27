import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEditorStore } from '@/stores/editor'

describe('editor backup persistence', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => data.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    })
    setActivePinia(createPinia())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('persists changes synchronously, including clearing the original', () => {
    const store = useEditorStore()
    store.setContent('待保存原稿')
    expect(JSON.parse(localStorage.getItem('wechat-md-workspace-backup') || '{}').content).toBe(
      '待保存原稿',
    )
    store.setContent('')
    expect(JSON.parse(localStorage.getItem('wechat-md-workspace-backup') || '{}').content).toBe('')
    expect(store.persistenceError).toBeNull()
  })

  it('keeps unsaved edits in memory and reports quota failures until a real retry succeeds', () => {
    const store = useEditorStore()
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    store.setContent('不能丢的修改')
    expect(store.content).toBe('不能丢的修改')
    expect(store.saveState).toBe('保存失败')
    store.markSaved()
    expect(store.saveState).toBe('保存失败')
    expect(store.saveDraft()).toBe(true)
    expect(write).toHaveBeenCalledTimes(2)
    expect(store.persistenceError).toBeNull()
    expect(JSON.parse(localStorage.getItem('wechat-md-workspace-backup') || '{}').content).toBe(
      '不能丢的修改',
    )
  })

  it('does not overwrite an unreadable backup with initialized content', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    const store = useEditorStore()
    store.setContent('临时工作区')
    expect(store.saveDraft()).toBe(false)
    expect(localStorage.setItem).not.toHaveBeenCalled()
    expect(store.persistenceError).toContain('无法读取编辑区备份')
  })

  it('preserves malformed recovery data and reads legacy plain drafts when no recovery envelope exists', () => {
    localStorage.setItem('wechat-md-draft', '# 旧版本原稿')
    expect(useEditorStore().content).toBe('# 旧版本原稿')
    localStorage.setItem('wechat-md-workspace-backup', '{broken')
    setActivePinia(createPinia())
    const store = useEditorStore()
    store.setContent('# 临时修改')
    expect(localStorage.getItem('wechat-md-workspace-backup')).toBe('{broken')
    expect(localStorage.getItem('wechat-md-draft')).toBe('# 旧版本原稿')
    expect(store.persistenceError).not.toBeNull()
  })
})
