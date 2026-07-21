import { describe, expect, it } from 'vitest'
import { leafifyHtml, validateWechatHtml } from '@/utils/wechatHtml'

describe('wechatHtml', () => {
  it('wraps generated text nodes with span leaf', () => {
    const html = leafifyHtml('<section><p>中文正文<strong>重点</strong></p></section>')
    expect(html).toContain('<span leaf="">中文正文</span>')
    expect(html).toContain('<span leaf="">重点</span>')
    expect(validateWechatHtml(html).valid).toBe(true)
  })

  it('rejects platform-incompatible output', () => {
    const result = validateWechatHtml('<div class="card"><p>正文</p></div>')
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThanOrEqual(3)
  })

  it('detects partially unwrapped Chinese text', () => {
    const result = validateWechatHtml('<section><span leaf="">已包裹</span><p>遗漏文字</p></section>')
    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.text.includes('未使用 span leaf'))).toBe(true)
  })
})
