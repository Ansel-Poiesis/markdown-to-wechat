import specimen from '../../design/2026-09-27/specimen.md?raw'
import { parseFragment } from 'parse5'
import { describe, expect, it } from 'vitest'
import { designThemes } from '@/config/designThemes'
import { codeThemes } from '@/config/themes'
import { STYLE_PRESETS } from '@/stores/settings'
import type { DesignThemeKey, ThemeBase } from '@/types'
import { renderWechatMarkdown } from '@/services/wechatRenderer'
import { renderMarkdown } from '@/utils/markdownRenderer'

const keys: DesignThemeKey[] = [
  'qiuhe',
  'zhujian',
  'songyan',
  'yuebai',
  'qingdai',
  'zhuzhi',
  'haitang',
  'shupian',
  'liujin',
]

function textContent(html: string): string {
  const stack = [...parseFragment(html).childNodes].reverse()
  const text: string[] = []
  while (stack.length) {
    const node = stack.pop()!
    if ('value' in node) text.push(node.value)
    if ('childNodes' in node) stack.push(...[...node.childNodes].reverse())
  }
  return text.join('').replace(/\u00a0/g, ' ')
}

describe('Chinese editorial theme collection', () => {
  it('retains every saved theme and CLI identifier', () => {
    expect(Object.keys(designThemes)).toEqual(keys)
    expect(STYLE_PRESETS.map((preset) => preset.key)).toEqual(keys)
  })

  it.each(keys)('%s keeps the same source content and passes the WeChat gate', (theme) => {
    const before = specimen
    const output = renderWechatMarkdown(specimen, { theme })
    const text = textContent(output.html)
    expect(output.valid, JSON.stringify(output.issues)).toBe(true)
    expect(specimen).toBe(before)
    for (const sentence of [
      '把日常写成值得读的文章',
      '试排导语',
      '清晨，街边的小店刚刚开门。',
      '必要的补充，放进真正属于它的层级。',
      '    return note',
      '试排提醒',
      '没有真实人物署名。',
      '这是排版测试注释，不代表外部引文或事实来源。',
    ])
      expect(text).toContain(sentence)
    expect(text).not.toMatch(/AUTUMN NOTES|CRITICAL ANALYSIS|CONTENTS|SECTIONS|PAPER ARCHIVE/)
    expect(output.html).not.toMatch(/<style|class=|\sid=|@font-face|https?:[^" ]+\.(?:woff|ttf)/)
  })

  it('keeps structural and typographic differences after colors are removed', () => {
    const structures = keys.map((theme) =>
      renderWechatMarkdown(specimen, { theme }).html.replace(
        /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/gi,
        'COLOR',
      ),
    )
    expect(new Set(structures).size).toBe(9)
    expect(
      new Set(STYLE_PRESETS.map((preset) => preset.settings.lineHeight)).size,
    ).toBeGreaterThanOrEqual(5)
  })

  it('shows automatic TOCs for three-section analysis, knowledge and tutorial articles only', () => {
    for (const theme of keys) {
      const html = renderWechatMarkdown(specimen, { theme }).html
      expect(html.includes('本文目录')).toBe(['songyan', 'yuebai', 'liujin'].includes(theme))
    }
    const short = '# 标题\n\n## 第一节\n\n正文\n\n## 第二节\n\n正文'
    expect(renderWechatMarkdown(short, { theme: 'songyan' }).html).not.toContain('本文目录')
    expect(renderWechatMarkdown(short, { theme: 'qiuhe', toc: 'show' }).html).toContain('本文目录')
    expect(renderWechatMarkdown(specimen, { theme: 'liujin', toc: 'hide' }).html).not.toContain(
      '本文目录',
    )
  })

  it('does not invent theme mottos or publication metadata, and keeps explicit ending text', () => {
    const plain = renderWechatMarkdown('# 一篇短文\n\n原文。').html
    expect(textContent(plain)).toBe('一篇短文原文。')
    const custom = renderWechatMarkdown('# 一篇短文\n\n原文。', {
      endMark: 'show',
      endMarkText: '下次见',
    })
    expect(textContent(custom.html)).toContain('下次见')
  })

  it.each(keys)('%s still renders images and the supplied caption safely', (theme) => {
    const output = renderWechatMarkdown('![测试图说明](data:image/png;base64,iVBORw0KGgo=)', {
      theme,
    })
    expect(output.valid).toBe(true)
    expect(output.html).toContain('alt="测试图说明"')
    expect(textContent(output.html)).toContain('测试图说明')
  })

  it('retains independent component overrides without restoring removed English furniture', () => {
    const theme: ThemeBase = {
      fontFamily: 'sans-serif',
      color: '#28241f',
      accent: '#a94f32',
      muted: '#746b60',
      border: '#e6ded3',
      bgSoft: '#f3eee7',
      quoteBg: '#f0e9df',
      h1Mode: 'plain',
      headingMode: 'plain',
      quoteMode: 'bar',
      quoteMode2: 'fade',
      designKey: 'qiuhe',
      componentOverrides: { cover: 'ticket', section: 'stamp', tocMode: 'hide' },
    }
    const html = renderMarkdown('# 标题\n\n## 章节\n\n正文', theme, codeThemes.paper!)
    expect(html).toContain('border-top:4px solid #28241f')
    expect(html).toContain('border:1px solid #a94f32')
    expect(html).not.toContain('AUTUMN NOTES')
  })
})
