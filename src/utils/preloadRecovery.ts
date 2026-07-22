const PRELOAD_RELOAD_KEY = 'wechat-md-preload-reload-at'
const PRELOAD_RELOAD_COOLDOWN = 60_000

type ReloadStorage = Pick<Storage, 'getItem' | 'setItem'>

export function shouldReloadAfterPreloadError(
  storage: ReloadStorage,
  now = Date.now(),
): boolean {
  try {
    const lastReload = Number(storage.getItem(PRELOAD_RELOAD_KEY) || 0)
    if (
      Number.isFinite(lastReload) &&
      lastReload <= now &&
      now - lastReload < PRELOAD_RELOAD_COOLDOWN
    ) {
      return false
    }
    storage.setItem(PRELOAD_RELOAD_KEY, String(now))
    return true
  } catch {
    return false
  }
}
