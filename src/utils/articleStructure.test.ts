import { describe, expect, it } from 'vitest'
import { analyzeArticle, stripInlineMarkdown } from '@/utils/articleStructure'

describe('analyzeArticle', () => {
  it('keeps unmatched bracket headings literal and strips balanced link destinations', () => {
    const source = '['.repeat(100000)
    expect(analyzeArticle('# ' + source).title).toBe(source)
    expect(
      stripInlineMarkdown(
        '**title** [a](https://example.com/a_(b)) ![image](https://example.com/a.png)',
      ),
    ).toBe('title a image')
  })
  it('extracts article-level structure without reading headings inside code blocks', () => {
    const document = analyzeArticle(`# 主标题

## 第一章

\`\`\`md
## 不是章节
\`\`\`

### 小节

## 第二章`)

    expect(document.title).toBe('主标题')
    expect(document.sectionCount).toBe(2)
    expect(document.headings.map((heading) => heading.text)).toEqual([
      '主标题',
      '第一章',
      '小节',
      '第二章',
    ])
    expect(document.hasCode).toBe(true)
  })
})
