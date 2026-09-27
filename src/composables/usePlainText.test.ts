import { describe, expect, it } from 'vitest'
import { markdownToPlainText } from '@/composables/usePlainText'

describe('clear Markdown formatting without deleting content', () => {
  it('retains fenced code including Markdown-looking lines and literal punctuation', () => {
    const code = "const s = '**literal**';\n# not a heading\n\n\nconsole.log('...', '--');"
    expect(markdownToPlainText(`# 标题\n\n\`\`\`js\n${code}\n\`\`\``)).toBe(`标题\n\n${code}`)
  })

  it('supports tilde fences, longer fences and unfinished fences without deleting their body', () => {
    expect(markdownToPlainText('~~~~text\n**原文**\n~~~\n~~~~')).toBe('**原文**\n~~~')
    expect(markdownToPlainText('```js\nconst unfinished = true')).toBe('const unfinished = true')
  })

  it('keeps code span contents literal while clearing adjacent emphasis and task markers', () => {
    expect(markdownToPlainText('- [x] **完成** `**raw**`')).toBe('完成 **raw**')
    expect(markdownToPlainText('1. [链接](https://example.com) 和 ``a ` b``')).toBe('链接 和 a ` b')
  })
})
