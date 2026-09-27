import { describe, expect, it } from 'vitest'
import { createImagegenBrief, IMAGEGEN_MAX_SOURCE_LENGTH, imagegenStyles } from './imagegen'

describe('imagegen article handoff', () => {
  it('preserves source verbatim and keeps generation pending', () => {
    const source = '# 让排版，回到阅读。\r\n\r\n正文有 **重点**、数字 2026 和 `code`。'
    const brief = createImagegenBrief(source)
    expect(brief.sourceText).toBe(source)
    expect(brief.prompt).toContain(JSON.stringify(source))
    expect(brief.status).toBe('waiting_for_imagegen')
    expect(brief.title).toBe('让排版，回到阅读。')
  })
  it('supports all declared directions with explicit title', () => {
    for (const style of imagegenStyles) {
      const brief = createImagegenBrief('正文', { style: style.id, title: '准确标题' })
      expect(brief.prompt).toContain(style.direction)
      expect(brief.title).toBe('准确标题')
    }
  })
  it('rejects excessive input instead of silently truncating', () => {
    expect(() => createImagegenBrief('字'.repeat(IMAGEGEN_MAX_SOURCE_LENGTH + 1))).toThrow('4000')
    expect(() => createImagegenBrief('  ')).toThrow('原稿')
  })
  it('does not use code headings as the article title', () => {
    expect(createImagegenBrief('```md\n# 代码\n```\n# 真正标题').title).toBe('真正标题')
  })
})
