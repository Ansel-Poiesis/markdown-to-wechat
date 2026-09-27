import { afterEach, describe, expect, it, vi } from 'vitest'
import { activateModalFocus } from '@/composables/useModalFocus'

function fixture() {
  const doc = Object.assign(new EventTarget(), { activeElement: null as unknown })
  const element = () => {
    const node = {
      focus: vi.fn(() => {
        doc.activeElement = node
      }),
      isConnected: true,
      getClientRects: () => [{}],
      closest: () => null,
    }
    return node as unknown as HTMLElement
  }
  const trigger = element()
  const first = element()
  const last = element()
  const dialog = Object.assign(element(), {
    querySelectorAll: () => [first, last],
    contains: (target: unknown) => target === first || target === last,
  })
  doc.activeElement = trigger
  vi.stubGlobal('document', doc)
  const key = (value: string, shiftKey = false) => {
    const event = Object.assign(new Event('keydown', { cancelable: true }), {
      key: value,
      shiftKey,
    })
    doc.dispatchEvent(event)
    return event
  }
  return { doc, trigger, first, last, dialog, key }
}

describe('modal keyboard focus', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('moves focus into the dialog, cycles Tab in both directions and restores the trigger', () => {
    const f = fixture()
    const cleanup = activateModalFocus(f.dialog, vi.fn())
    try {
      expect(f.doc.activeElement).toBe(f.first)
      f.key('Tab', true)
      expect(f.doc.activeElement).toBe(f.last)
      f.key('Tab')
      expect(f.doc.activeElement).toBe(f.first)
    } finally {
      cleanup()
    }
    expect(f.doc.activeElement).toBe(f.trigger)
    f.key('Tab')
    expect(f.doc.activeElement).toBe(f.trigger)
  })

  it('handles Escape only in the top modal and removes handlers on close', () => {
    const f = fixture()
    const closeFirst = vi.fn()
    const closeTop = vi.fn()
    const cleanupFirst = activateModalFocus(f.dialog, closeFirst)
    const second = Object.assign({}, f.dialog) as HTMLElement
    const cleanupTop = activateModalFocus(second, closeTop)
    try {
      expect(f.key('Escape').defaultPrevented).toBe(true)
      expect(closeTop).toHaveBeenCalledOnce()
      expect(closeFirst).not.toHaveBeenCalled()
    } finally {
      cleanupTop()
      cleanupFirst()
    }
    f.key('Escape')
    expect(closeTop).toHaveBeenCalledOnce()
    expect(closeFirst).not.toHaveBeenCalled()
  })
})
