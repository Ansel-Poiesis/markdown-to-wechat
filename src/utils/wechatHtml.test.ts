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

  it('rejects malformed markup even when it contains span leaf', () => {
    const result = validateWechatHtml('<section><<span leaf="">正文</span></section>')

    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.text.includes('结构异常'))).toBe(true)
  })

  it('rejects event handlers and unknown elements from structured output', () => {
    const result = validateWechatHtml(
      '<section><iframe src="https://example.com"></iframe><span leaf="" onclick="alert(1)">正文</span></section>',
    )

    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.text.includes('iframe'))).toBe(true)
    expect(result.issues.some((issue) => issue.text.includes('onclick'))).toBe(true)
  })

  it.each([
    '<section><img src="javascript:alert(1)" alt="x"><span leaf="">正文</span></section>',
    '<section><img src="data:image/svg+xml;base64,PHN2Zz4=" alt="x"><span leaf="">正文</span></section>',
    '<section style="background:url(https://attacker.example/x)"><span leaf="">正文</span></section>',
    '<section><span leaf="not-empty">正文</span></section>',
    '<section><table><tbody><tr><td colspan="999"><span leaf="">正文</span></td></tr></tbody></table></section>',
  ])('rejects unsafe allowed-attribute values: %s', (html) => {
    const result = validateWechatHtml(html)

    expect(result.valid).toBe(false)
    expect(result.issues.some((issue) => issue.text.includes('不安全的属性值'))).toBe(true)
  })

  it('accepts absolute raster image sources and bounded table spans', () => {
    const result = validateWechatHtml(
      '<section><img src="https://example.com/image.png" alt="示例"><table><tbody><tr><td colspan="2"><span leaf="">正文</span></td></tr></tbody></table></section>',
    )

    expect(result.valid).toBe(true)
  })
})
