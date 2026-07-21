import { describe, expect, it } from 'vitest'
import { analyzeArticle } from '@/utils/articleStructure'

describe('analyzeArticle', () => {
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
