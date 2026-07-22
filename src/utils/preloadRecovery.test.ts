import { describe, expect, it, vi } from 'vitest'
import { shouldReloadAfterPreloadError } from '@/utils/preloadRecovery'

describe('preload recovery', () => {
  it('allows the first recovery reload and records its timestamp', () => {
    const storage = createStorage()

    expect(shouldReloadAfterPreloadError(storage, 100_000)).toBe(true)
    expect(storage.getItem('wechat-md-preload-reload-at')).toBe('100000')
  })

  it('blocks repeated reloads during the cooldown', () => {
    const storage = createStorage()
    expect(shouldReloadAfterPreloadError(storage, 100_000)).toBe(true)

    expect(shouldReloadAfterPreloadError(storage, 120_000)).toBe(false)
    expect(shouldReloadAfterPreloadError(storage, 160_000)).toBe(true)
  })

  it('fails closed when session storage is unavailable', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new DOMException('Denied', 'SecurityError')
      }),
      setItem: vi.fn(),
    }

    expect(shouldReloadAfterPreloadError(storage, 100_000)).toBe(false)
    expect(storage.setItem).not.toHaveBeenCalled()
  })
})

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}
