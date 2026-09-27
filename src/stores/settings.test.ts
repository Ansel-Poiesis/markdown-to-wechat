import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, disposePinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'
import { getSSRHandler, setSSRHandler } from '@vueuse/core'
import { MAGAZINE_DEFAULTS } from '@/config/themes'
import { useSettingsStore } from '@/stores/settings'

describe('settings store', () => {
  let pinia: Pinia
  const originalStorageHandler = getSSRHandler('getDefaultStorage', () => undefined)

  beforeEach(() => {
    const data = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    })
    // Exercise real VueUse serialization and watchers in Node, where defaultWindow is absent.
    setSSRHandler('getDefaultStorage', () => localStorage)
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    disposePinia(pinia)
    setSSRHandler('getDefaultStorage', originalStorageHandler)
    vi.unstubAllGlobals()
  })

  function reloadSettings() {
    disposePinia(pinia)
    pinia = createPinia()
    setActivePinia(pinia)
    return useSettingsStore()
  }

  it('rejects persisted color values that could escape generated style attributes', () => {
    localStorage.setItem('wechat-md-text-color', '"><img src=x onerror=alert(1)>')
    localStorage.setItem('wechat-md-accent', 'url(https://attacker.example/x)')

    const store = useSettingsStore()

    expect(store.textColor).toBe(MAGAZINE_DEFAULTS.textColor)
    expect(store.accentColor).toBe(MAGAZINE_DEFAULTS.accentColor)
  })

  it('completes the migration on a fresh install before a later Agent margin of 24', async () => {
    const store = useSettingsStore()
    await nextTick()
    expect(localStorage.getItem('wechat-md-page-margin-version')).toBe('2')

    store.pageMargin = 24
    await nextTick()
    expect(localStorage.getItem('wechat-md-page-margin')).toBe('24')
    expect(reloadSettings().pageMargin).toBe(24)
  })

  it('migrates legacy margin 24 once, then preserves an explicitly selected 24', async () => {
    localStorage.setItem('wechat-md-page-margin-version', '1')
    localStorage.setItem('wechat-md-page-margin', '24')
    const store = useSettingsStore()
    expect(store.pageMargin).toBe(MAGAZINE_DEFAULTS.pageMargin)
    await nextTick()
    expect(localStorage.getItem('wechat-md-page-margin-version')).toBe('2')

    store.pageMargin = 24
    await nextTick()
    expect(reloadSettings().pageMargin).toBe(24)
  })

  it.each([
    { fontSize: 17, lineHeight: 1.23, pageMargin: 19 },
    { fontSize: 10, lineHeight: 1, pageMargin: 0 },
    { fontSize: 32, lineHeight: 3, pageMargin: 48 },
    { fontSize: 16.5, lineHeight: 2.125, pageMargin: 24 },
  ])('preserves in-range Agent typography through real storage reload: %o', async (options) => {
    const store = useSettingsStore()
    await nextTick()
    Object.assign(store, options)
    await nextTick()
    const reloaded = reloadSettings()
    expect({
      fontSize: reloaded.fontSize,
      lineHeight: reloaded.lineHeight,
      pageMargin: reloaded.pageMargin,
    }).toEqual(options)
  })
})
