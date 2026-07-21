import { describe, expect, it } from 'vitest'
import { welcomeMarkdown } from '@/config/templates'
import {
  renderWechatMarkdown,
  resolveRenderWechatOptions,
  toHtmlDocument,
  type RenderWechatOptions,
} from './wechatRenderer'

describe('wechatRenderer', () => {
  it('renders a valid inline-style fragment with resolved defaults', () => {
    const result = renderWechatMarkdown('# 自动发布\n\n这是一段 **正文**。')

    expect(result.valid).toBe(true)
    expect(result.html).toContain('<span leaf="">')
    expect(result.html).not.toMatch(/\sclass=/i)
    expect(result.options.theme).toBe('qiuhe')
    expect(result.options.codeTheme).toBe('paper')
  })

  it('renders the first-open sample as a valid feature sample', () => {
    const result = renderWechatMarkdown(welcomeMarkdown)

    expect(result.valid).toBe(true)
    expect(result.html).toContain('把 Markdown 变成公众号文章')
    expect(result.html).not.toContain('欢迎仪式')
    expect(result.html).toContain('排版提示')
    expect(result.html).toContain('<table')
    expect(result.html).toContain('wechat-inline-html')
    expect(result.html).toContain('参考链接')
  })

  it('applies basic typography and component parameters', () => {
    const result = renderWechatMarkdown('# 参数测试\n\n## 章节\n\n正文', {
      theme: 'songyan',
      fontFamily: 'serif',
      fontSize: 18,
      lineHeight: 2,
      pageMargin: 28,
      accent: '#123456',
      textColor: '#202020',
      canvas: '#fefefe',
      toc: 'hide',
      endMark: 'show',
      endMarkText: '完成测试',
    })

    expect(result.valid).toBe(true)
    expect(result.html).toContain("font-family:'Optima'")
    expect(result.html).toContain('font-size:18px')
    expect(result.html).toContain('padding:18px 28px')
    expect(result.html).toContain('完成测试')
    expect(result.html).not.toContain('CONTENTS')
  })

  it('rejects unsupported values before rendering', () => {
    expect(() => resolveRenderWechatOptions({ accent: 'red' })).toThrow('#RRGGBB')
    expect(() => resolveRenderWechatOptions({ lineHeight: 4 })).toThrow('lineHeight')
    expect(() =>
      resolveRenderWechatOptions({ fontFamily: 'wenkai' as RenderWechatOptions['fontFamily'] }),
    ).toThrow('未知字体')
  })

  it('wraps fragments as standalone documents when requested', () => {
    const document = toHtmlDocument('<section>正文</section>', '标题 <测试>')
    expect(document).toContain('<!doctype html>')
    expect(document).toContain('<title>标题 &lt;测试&gt;</title>')
  })
})
