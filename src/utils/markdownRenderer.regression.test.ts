import { describe, expect, it } from 'vitest'
import { parseFragment } from 'parse5'
import { codeThemes, themes } from '@/config/themes'
import { renderWechatMarkdown } from '@/services/wechatRenderer'
import { highlightCode, MarkdownRenderLimitError, renderMarkdown } from '@/utils/markdownRenderer'
import { analyzeArticle } from '@/utils/articleStructure'

function render(markdown: string) {
  return renderWechatMarkdown(markdown, { profile: 'generic', toc: 'hide', endMark: 'hide' }).html
}

function visibleText(html: string): string {
  const stack = [...parseFragment(html).childNodes]
  const chunks: string[] = []
  while (stack.length) {
    const node = stack.shift()!
    if (node.nodeName === '#text') chunks.push((node as { value: string }).value)
    if ('childNodes' in node) stack.unshift(...node.childNodes)
  }
  return chunks.join('').replace(/\u00a0/g, ' ')
}

describe('renderer audit regressions', () => {
  it('escapes query strings and image alt text exactly once', () => {
    const html = render(
      '[A & B](https://example.com?q=one&next=two) ![A & B](https://example.com/a_b.png?x=1&y=2)',
    )
    expect(html).toContain('href="https://example.com?q=one&amp;next=two"')
    expect(html).toContain('src="https://example.com/a_b.png?x=1&amp;y=2"')
    expect(html).toContain('alt="A &amp; B"')
    expect(html).not.toContain('&amp;amp;')
  })

  it('keeps code spans atomic and supports backticks inside a longer delimiter', () => {
    const html = render(
      '`**literal** [link](https://example.com) ![image](https://example.com/a.png)` and `` a ` b ``',
    )
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('<img ')
    expect(html).not.toContain('<strong')
    expect(visibleText(html)).toContain(
      '**literal** [link](https://example.com) ![image](https://example.com/a.png) and a ` b',
    )
  })

  it('never applies emphasis to generated attributes or escaped delimiters', () => {
    const html = render(
      '![*literal*](https://example.com/a__b__c.png) [*label*](https://example.com/a*b*c) \\*literal\\*',
    )
    expect(html).toContain('alt="*literal*"')
    expect(html).toContain('src="https://example.com/a__b__c.png"')
    expect(html).toContain('href="https://example.com/a*b*c"')
    expect(html).toContain('<em>label</em>')
    expect(visibleText(html)).toContain('*literal*')
  })

  it('treats placeholder-like input as source instead of internal tokens', () => {
    const html = render('\u0000MD0\u0000 **real**')
    expect(visibleText(html)).toContain('\uFFFDMD0\uFFFD real')
    expect(html).toContain('<strong')
  })

  it('keeps balanced parentheses in URLs and displays unsafe URLs literally', () => {
    const html = render(
      '[ref](https://example.com/a_(b)?x=1&y=2 "Title") [bad](javascript:alert(1))',
    )
    expect(html).toContain('href="https://example.com/a_(b)?x=1&amp;y=2"')
    expect(html).not.toContain('href="javascript:')
    expect(visibleText(html)).toContain('[bad](javascript:alert(1))')
  })

  it('never nests anchors when a link label contains another link', () => {
    const html = render('[outer [inner](https://inner.invalid)](https://outer.invalid)')
    expect((html.match(/<a /g) || []).length).toBe(1)
    expect(html).toContain('href="https://inner.invalid"')
    expect(visibleText(html)).toContain('[outer inner](https://outer.invalid)')
  })

  it.each([
    '````md\n```\n[^literal]: code\n## not a heading\n````',
    '~~~md\n[^literal]: code\n## not a heading\n~~~',
  ])('retains footnote-like code and respects the complete fence (%s)', (source) => {
    const html = render(source + '\n\n## real heading')
    expect(visibleText(html)).toContain('[^literal]: code')
    expect(visibleText(html)).not.toContain('注释')
    expect(
      analyzeArticle(source + '\n\n## real heading').headings.map((heading) => heading.text),
    ).toEqual(['real heading'])
  })

  it('includes links that occur only inside footnotes in the external appendix', () => {
    const html = renderWechatMarkdown(
      '正文[^n]\n\n[^n]: [source](https://example.com?x=1&y=2)',
    ).html
    expect(visibleText(html)).toContain('[1] source：https://example.com?x=1&y=2')
    expect(visibleText(html)).toContain('[1] source[1]')
  })

  it('assigns external references in source order through nested lists', () => {
    const html = renderWechatMarkdown(
      '- [parent](https://example.com/p)\n  - [child](https://example.com/c)',
    ).html
    expect(visibleText(html)).toContain('parent[1]')
    expect(visibleText(html)).toContain('child[2]')
  })

  it('preserves an ordered list starting number and parenthesized markers', () => {
    const html = render('7) seventh\n8) eighth')
    expect(visibleText(html)).toContain('07seventh08eighth')
  })

  it('preserves escaped and code-span pipes without adding table columns', () => {
    const html = render(
      '| First | Second |\n| --- | --- |\n| a\\|b | `c|d` |\n| short |\n| a | b | ignored |',
    )
    expect((html.match(/<th /g) || []).length).toBe(2)
    expect((html.match(/<td /g) || []).length).toBe(6)
    expect(visibleText(html)).toContain('a|bc|dshortab')
    expect(html).not.toContain('ignored')
  })

  it('supports a single-column table', () => {
    const html = render('| One |\n| --- |\n| value |')
    expect(html).toContain('<table ')
    expect((html.match(/<th /g) || []).length).toBe(1)
  })

  it('keeps nested lists inside valid block containers', () => {
    const html = render('- parent\n  - child\n    - grandchild')
    // Parsing must not repair a paragraph containing a block list into extra nodes.
    expect(html).not.toMatch(/<p\b[^>]*>[^]*?<section/)
    expect(visibleText(html)).toContain('parent')
    expect(visibleText(html)).toContain('grandchild')
  })

  it('preserves nested quote structure and bounds excessive quote depth', () => {
    const html = render('> outer\n>> inner\n> outer again')
    expect((html.match(/<section/g) || []).length).toBe(3)
    expect(visibleText(render('>'.repeat(2000) + ' tail'))).toContain('tail')
  })

  it('recognizes language aliases and multiline comments without losing source', () => {
    const code = '/* first\nconst is still a comment\n*/\nconst answer = 42'
    const highlighted = highlightCode(code, 'javascript', codeThemes.paper!)
    expect(visibleText(highlighted)).toBe(code)
    expect(highlighted).toContain(`color:${codeThemes.paper!.comment}">const is still a comment`)
    expect(highlighted).toContain('font-weight:700">const')
    expect(highlightCode('const x = 42', 'unknown', codeThemes.paper!)).toBe('const x = 42')
  })

  it('preserves repeated code spaces and expands tabs to four visible spaces', () => {
    const html = render('```js\n    const  value = "a  b"\n\treturn  value\n```')
    const text = visibleText(html).replace(/\u00a0/g, ' ')
    expect(text).toContain('    const  value = "a  b"')
    expect(text).toContain('    return  value')
    expect(html).not.toContain('white-space:pre')
  })

  it('encodes style attributes before markup reaches the HTML parser', () => {
    const base = { ...themes.magazine!.base, color: '#fff" onmouseover="alert(1)' }
    const html = renderMarkdown('plain', base, codeThemes.paper!, { leafify: false })
    expect(html).toContain('&quot; onmouseover=&quot;')
    expect(html).not.toMatch(/" onmouseover="/)
  })

  it('keeps callout headings out of the article TOC', () => {
    const article = analyzeArticle('::: note sample\n## literal in note\n:::\n\n## actual')
    expect(article.headings.map((heading) => heading.text)).toEqual(['actual'])
  })

  it('rejects excessive inline expansion before HTML parsing can exhaust memory', () => {
    expect(() => render('`a` '.repeat(10001))).toThrow(MarkdownRenderLimitError)
    expect(() => render('**bold** '.repeat(10001))).toThrow(MarkdownRenderLimitError)
  })

  it('bounds the source and block structure independently of inline formatting', () => {
    expect(() => render('x'.repeat(2 * 1024 * 1024 + 1))).toThrow(MarkdownRenderLimitError)
    expect(() => render('- item\n'.repeat(20001))).toThrow(MarkdownRenderLimitError)
    expect(() => render('\n'.repeat(50000))).toThrow(MarkdownRenderLimitError)
  })

  it('checks escaped HTML expansion before the leafification parser', () => {
    expect(() => renderWechatMarkdown('<'.repeat(1100000))).toThrow(MarkdownRenderLimitError)
  })

  it('charges table padding before allocating the header-by-row product', () => {
    const source = 'a | '.repeat(500) + '\n' + '--- | '.repeat(500) + '\n' + 'x |\n'.repeat(500)
    expect(() => render(source)).toThrow(MarkdownRenderLimitError)
  })
})
