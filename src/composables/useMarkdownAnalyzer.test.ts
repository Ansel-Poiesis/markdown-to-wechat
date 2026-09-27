import { describe, expect, it } from 'vitest'
import { useMarkdownAnalyzer } from './useMarkdownAnalyzer'
import { useMarkdownWarnings } from './useMarkdownWarnings'

describe('Markdown inspection matches fenced rendering', () => {
  const example = '# 标题\n\n````md\n# 示例标题\n![示例](./missing.png)\n[空链接]()\n```\n````\n\n正文'

  it('handles repeated unmatched link and image openers without scanning every suffix', () => {
    for (const value of ['['.repeat(100_000), '!['.repeat(50_000), '[x]('.repeat(25_000)]) {
      expect(useMarkdownAnalyzer({ value }).stats.value.links).toBe(0)
      expect(useMarkdownWarnings({ value }).warnings.value.some((w) => w.level === 'danger')).toBe(false)
    }
  })

  it('does not block copying literal Markdown examples inside longer fences', () => {
    expect(useMarkdownWarnings({ value: example }).warnings.value).toEqual([])
    expect(useMarkdownAnalyzer({ value: example }).stats.value).toMatchObject({
      headings: 1, images: 0, links: 0, codeBlocks: 1, wordCount: 4,
    })
  })

  it('recognizes tilde fences and a mismatched or short closing fence', () => {
    for (const value of ['~~~\n# 示例\n~~~', '````\n```\n````']) {
      expect(useMarkdownWarnings({ value }).warnings.value).toEqual([])
    }
    for (const value of ['~~~\n```', '````\n```']) {
      expect(useMarkdownWarnings({ value }).warnings.value).toContainEqual(
        expect.objectContaining({ type: 'unclosedCode', level: 'danger' }),
      )
    }
  })

  it('does not count image addresses as footnote links', () => {
    expect(useMarkdownWarnings({ value: '![图](https://example.com/image.png)' }).warnings.value)
      .not.toContainEqual(expect.objectContaining({ type: 'externalLink' }))
  })
})
