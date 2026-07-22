import { describe, expect, it } from 'vitest'
import { designThemes } from '@/config/designThemes'
import { renderMarkdown } from '@/utils/markdownRenderer'
import { validateWechatHtml } from '@/utils/wechatHtml'
import type { CodeTheme, DesignThemeKey, ThemeBase } from '@/types'

const codeTheme: CodeTheme = {
  name: '测试',
  background: '#f6f8fa',
  color: '#1f2328',
  border: '#d0d7de',
  keyword: '#6f42c1',
  string: '#0d7a56',
  comment: '#7a8490',
  number: '#cf222e',
}

const markdown = `# 一篇用于回归的文章

::: lead 导语
这是文章的开场，用来检查引言组件。
:::

## 为什么需要组件化

正文包含 **关键判断** 和 __重点标记__。

> 主题应该改变文章的表达结构，而不只是更换颜色。

1. 解析文章结构
2. 选择主题组件
3. 输出微信 HTML

## 数据与证据

| 指标 | 结果 |
| --- | --- |
| 主题 | 九套 |
| 门禁 | 已启用 |

\`\`\`ts
const ready = true
\`\`\`

::: signature Ansel
公众号排版工具维护者。
:::`

function theme(key: DesignThemeKey): ThemeBase {
  return {
    fontFamily: "'PingFang SC', sans-serif",
    color: '#292524',
    accent: '#b45309',
    muted: '#78716c',
    border: '#e7e5e4',
    bgSoft: '#fafaf9',
    quoteBg: '#f5f5f4',
    canvas: '#ffffff',
    h1Mode: 'center',
    headingMode: 'plain',
    quoteMode: 'bar',
    quoteMode2: 'fade',
    fontSize: 16,
    lineHeight: 1.7,
    pageMargin: 20,
    designKey: key,
  }
}

describe('renderMarkdown design system', () => {
  it.each(Object.keys(designThemes) as DesignThemeKey[])(
    'renders %s with its own component language and valid WeChat HTML',
    (key) => {
      const html = renderMarkdown(markdown, theme(key), codeTheme)
      expect(html).toContain(designThemes[key].eyebrow)
      expect(html).toContain(designThemes[key].endMark)
      expect(html).toContain('<span leaf="">')
      expect(html).not.toMatch(/<\/?div[\s>]/i)
      expect(html).not.toMatch(/\sclass=/i)
      expect(html).not.toMatch(/\sid=/i)
      expect(html).not.toMatch(/white-space\s*:\s*pre/i)
      expect(validateWechatHtml(html).valid).toBe(true)
    },
  )

  it('produces structurally different output for editorial and technical themes', () => {
    const editorial = renderMarkdown(markdown, theme('qiuhe'), codeTheme)
    const technical = renderMarkdown(markdown, theme('songyan'), codeTheme)
    expect(editorial).not.toBe(technical)
    expect(editorial).toContain('AUTUMN NOTES')
    expect(technical).toContain('CRITICAL ANALYSIS')
  })

  it('lets component overrides change structure without changing the selected theme', () => {
    const overridden = theme('qiuhe')
    overridden.componentOverrides = {
      cover: 'minimal',
      section: 'stamp',
      tocMode: 'hide',
      endMarkMode: 'hide',
    }
    const html = renderMarkdown(markdown, overridden, codeTheme)
    expect(html).toContain('AUTUMN NOTES')
    expect(html).not.toContain('CONTENTS')
    expect(html).not.toContain('秋水有声')
    expect(validateWechatHtml(html).valid).toBe(true)
  })

  it('allows the article ending marker to be edited independently', () => {
    const customized = theme('qiuhe')
    customized.componentOverrides = {
      endMarkMode: 'show',
      endMarkText: '下次见',
    }
    const html = renderMarkdown(markdown, customized, codeTheme)
    expect(html).toContain('下次见')
    expect(html).not.toContain('秋水有声')
    expect(validateWechatHtml(html).valid).toBe(true)
  })

  it('keeps component structure while heading decorations are adjusted independently', () => {
    const plainTheme = theme('qiuhe')
    plainTheme.h1Mode = 'plain'
    plainTheme.h2Mode = 'plain'
    plainTheme.h3Mode = 'plain'
    plainTheme.h4Mode = 'plain'

    const decoratedTheme = { ...plainTheme }
    decoratedTheme.h1Mode = 'dash'
    decoratedTheme.h2Mode = 'chip'
    decoratedTheme.h3Mode = 'bar'
    decoratedTheme.h4Mode = 'marker'

    const headingMarkdown = `# 文章标题

## 章节标题

### 三级标题

#### 四级标题`
    const plain = renderMarkdown(headingMarkdown, plainTheme, codeTheme)
    const decorated = renderMarkdown(headingMarkdown, decoratedTheme, codeTheme)

    expect(plain).toContain('AUTUMN NOTES')
    expect(decorated).toContain('AUTUMN NOTES')
    expect(plain).toContain('font-size:28px')
    expect(decorated).toContain('font-size:28px')
    expect(decorated).toContain('border-bottom:1.5px dashed #b45309')
    expect(decorated).toContain('background:#b45309;border-radius:3px')
    expect(decorated).toContain('border-left:4px solid #b45309')
    expect(decorated).toContain('linear-gradient(transparent 58%,rgba(180,83,9,0.22) 0)')
    expect(decorated).not.toBe(plain)
    expect(validateWechatHtml(decorated).valid).toBe(true)
  })

  it('numbers footnotes and external links independently', () => {
    const html = renderMarkdown(
      '正文[^note] [外链](https://example.com)\n\n[^note]: 注释内容',
      theme('qiuhe'),
      codeTheme,
    )
    const text = html.replace(/<[^>]+>/g, '')
    expect(text).toContain('正文[1] 外链[1]')
    expect(text).toContain('[1] 外链：https://example.com')
    expect(text).toContain('[1] 注释内容')
    expect(text).not.toContain('外链[2]')
  })

  it('keeps HTML source code escaped without corrupting generated highlight spans', () => {
    const html = renderMarkdown('```html\n<span>1</span>\n```', theme('songyan'), codeTheme)

    expect(html).toContain('&lt;')
    expect(html).not.toContain('<<span')
    expect(validateWechatHtml(html).valid).toBe(true)
  })

  it('escapes custom ending text and table-of-contents titles', () => {
    const customized = theme('qiuhe')
    customized.componentOverrides = {
      tocMode: 'show',
      endMarkMode: 'show',
      endMarkText: '<img src=x onerror=alert(1)>',
    }
    const html = renderMarkdown(
      '# 标题\n\n## <script>alert(1)</script>\n\n正文\n\n## 第二节\n\n正文',
      customized,
      codeTheme,
    )

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(validateWechatHtml(html).valid).toBe(true)
  })
})
