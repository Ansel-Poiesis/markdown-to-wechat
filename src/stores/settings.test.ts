import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { MAGAZINE_DEFAULTS } from '@/config/themes'
import { useSettingsStore } from '@/stores/settings'

describe('settings store', () => {
  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    })
    setActivePinia(createPinia())
  })

  it('rejects persisted color values that could escape generated style attributes', () => {
    localStorage.setItem('wechat-md-text-color', '"><img src=x onerror=alert(1)>')
    localStorage.setItem('wechat-md-accent', 'url(https://attacker.example/x)')

    const store = useSettingsStore()

    expect(store.textColor).toBe(MAGAZINE_DEFAULTS.textColor)
    expect(store.accentColor).toBe(MAGAZINE_DEFAULTS.accentColor)
  })
})
