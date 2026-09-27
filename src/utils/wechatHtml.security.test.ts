import { describe, expect, it } from 'vitest'
import { leafifyHtml, validateWechatHtml } from './wechatHtml'

describe('WeChat HTML gate red team', () => {
  it.each([
    String.raw`background:u\72l(https://attacker.invalid/tracker)`,
    'background:u/**/rl(https://attacker.invalid/tracker)',
    String.raw`position:f\69xed;inset:0`,
    'background:image-set("https://attacker.invalid/tracker" 1x)',
    'width:expression/**/(alert(1))',
  ])('rejects obfuscated or alternate CSS fetch/active syntax: %s', (style) => {
    expect(validateWechatHtml(`<p style='${style}'><span leaf="">内容</span></p>`).valid).toBe(
      false,
    )
  })

  it('does not corrupt text when an attribute contains an angle bracket', () => {
    const html = leafifyHtml('<p title="a > b">text</p>')
    expect(html).toBe('<p title="a > b"><span leaf="">text</span></p>')
  })

  it('handles deeply nested untrusted fragments without a stack overflow', () => {
    const html = '<section>'.repeat(12_000) + '<span leaf="">x</span>' + '</section>'.repeat(12_000)
    expect(() => validateWechatHtml(html)).not.toThrow()
  })

  it('checks CSS only in style attributes, not literal programming examples', () => {
    expect(
      validateWechatHtml(
        '<p><span leaf="">CSS: position:fixed; display:grid; class="example"</span></p>',
      ).valid,
    ).toBe(true)
  })

  it('does not demand leaf wrappers for an image alt attribute without text nodes', () => {
    expect(
      validateWechatHtml('<img src="https://example.com/image.png" alt="中文图片">').valid,
    ).toBe(true)
  })
})
