import type { CodeTheme, ThemeBase } from '@/types'
import { analyzeArticle } from '@/utils/articleStructure'
import {
  createThemeRenderContext,
  renderCallout,
  renderCover,
  renderDivider,
  renderEndMark,
  renderImage,
  renderList,
  renderQuote,
  renderSectionHeading,
  renderTable,
  renderToc,
} from '@/utils/themeComponents'
import { leafifyHtml } from '@/utils/wechatHtml'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function styleText(style: Record<string, string | number | undefined>): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`)
    .join(';')
}

function alphaColor(color: string | undefined, alpha = '33'): string {
  const hex = color || '#b14f2a'
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const opacity = Math.round((parseInt(alpha, 16) / 255) * 100) / 100
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return hex
}

function inline(
  tag: string,
  content: string,
  style: Record<string, string | number | undefined> = {},
  attrs: Record<string, string | number | undefined> = {},
): string {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join('')
  const styleAttr = Object.keys(style).length ? ` style="${styleText(style)}"` : ''
  return `<${tag}${styleAttr}${attrText}>${content}</${tag}>`
}

function selfClosing(
  tag: string,
  style: Record<string, string | number | undefined> = {},
  attrs: Record<string, string | number | undefined> = {},
): string {
  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ` ${key}="${escapeHtml(String(value))}"`)
    .join('')
  const styleAttr = Object.keys(style).length ? ` style="${styleText(style)}"` : ''
  return `<${tag}${styleAttr}${attrText}>`
}

export function loadImageSettings(): { width: string; radius: number; caption: boolean } {
  return { width: '100%', radius: 6, caption: true }
}

function imageHtml(alt: string, src: string, settings = loadImageSettings()): string {
  const image = selfClosing(
    'img',
    {
      display: 'block',
      width: settings.width,
      maxWidth: '100%',
      height: 'auto',
      margin: '18px auto 8px',
      borderRadius: `${settings.radius}px`,
    },
    { src, alt },
  )
  if (!settings.caption || !alt) return image
  return inline(
    'figure',
    image +
      inline('figcaption', escapeHtml(alt), {
        margin: '0 0 18px',
        color: '#8a8f98',
        fontSize: '13px',
        lineHeight: '1.6',
        textAlign: 'center',
      }),
    { margin: '0 0 18px' },
  )
}

export function highlightCode(
  code: string,
  lang: string | undefined,
  codeTheme: CodeTheme,
): string {
  const escaped = escapeHtml(code)
  const color = codeTheme.keyword || '#7c3aed'
  const stringColor = codeTheme.string || '#0f766e'
  const commentColor = codeTheme.comment || '#8a8f98'
  const numberColor = codeTheme.number || '#b45309'
  const keywordSets: Record<string, string> = {
    js: 'await break case catch class const continue default delete do else export extends finally for function if import in instanceof let new return switch throw try typeof var void while yield async',
    ts: 'await break case catch class const continue default delete do else export extends finally for function if import in instanceof let new return switch throw try typeof var void while yield async interface type enum implements private public readonly',
    css: 'display position color background margin padding border grid flex width height font transform transition animation opacity z-index overflow float clear box-shadow border-radius align justify content items',
    html: 'section article div span p h1 h2 h3 img a table tr td th ul ol li header footer main nav aside figure figcaption strong em code pre blockquote',
    python:
      'and as assert break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield',
    bash: 'if then else elif fi for while do done case esac in function return exit export source alias sudo chmod chown cp mv rm mkdir cd ls cat grep sed awk echo printf touch wget curl git docker',
    json: 'true false null',
    yaml: 'true false yes no on off null',
    sql: 'select from where and or not insert into values update delete create table drop index join left right inner outer union all group by order having limit offset distinct count sum avg max min as on set alter add column primary key foreign references',
    go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var',
    rust: 'as async await break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while',
  }
  const normalized = (lang || 'js').toLowerCase()
  const keywords = keywordSets[normalized] ?? keywordSets.js ?? ''
  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;|\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (match) =>
      inline('span', match, { color: commentColor }),
    )
    .replace(/(&quot;.*?&quot;|'.*?'|`.*?`)/g, (match) =>
      inline('span', match, { color: stringColor }),
    )
    .replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => inline('span', match, { color: numberColor }))
    .replace(new RegExp(`\\b(${keywords.split(' ').join('|')})\\b`, 'g'), (match) =>
      inline('span', match, { color, fontWeight: '700' }),
    )
}

export function safeUrl(url: string): string {
  if (!url) return ''
  const allowed = ['http:', 'https:', 'mailto:']
  try {
    const baseUrl = typeof window === 'undefined' ? 'https://localhost/' : window.location.href
    const parsed = new URL(url, baseUrl)
    if (parsed.protocol === 'data:') {
      return /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(url) ? url : ''
    }
    if (allowed.includes(parsed.protocol)) return url
    return ''
  } catch {
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) return url
    return ''
  }
}

function parseInline(
  text: string,
  links: Array<{ label: string; href: string }>,
  theme?: ThemeBase,
): string {
  let value = escapeHtml(text)

  value = value.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
    const safeSrc = safeUrl(src)
    if (!safeSrc) return escapeHtml(`![${alt}](${src})`)
    return imageHtml(alt, safeSrc)
  })

  value = value.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const safeHref = safeUrl(href)
    if (!safeHref) return escapeHtml(`[${label}](${href})`)
    const externalLinks = links.filter((item) => !item.href.startsWith('fn:'))
    const id = externalLinks.findIndex((item) => item.href === safeHref)
    if (id < 0) links.push({ label, href: safeHref })
    const index = id >= 0 ? id + 1 : externalLinks.length + 1
    return `${label}<sup style="color:#888;font-size:12px;">[${index}]</sup>`
  })

  value = value.replace(/`([^`]+)`/g, (_, code) =>
    inline('code', code, {
      padding: '2px 5px',
      borderRadius: '4px',
      background: '#f0f2f4',
      color: '#c43d3d',
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
      fontSize: '0.92em',
    }),
  )
  value = value.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  value = value.replace(/__([^_]+)__/g, (_, text) => {
    const underlineColor = theme?.underlineColor || theme?.accent
    const underlineMode = theme?.underlineMode || 'solid'
    if (underlineMode === 'marker') {
      return inline('span', text, {
        background: `linear-gradient(transparent 58%, ${alphaColor(underlineColor, '4d')} 0)`,
        padding: '0 2px',
      })
    }
    return inline('span', text, {
      textDecoration: 'underline',
      textDecorationStyle: underlineMode,
      textDecorationColor: underlineColor,
      textUnderlineOffset: '4px',
      textDecorationThickness: '1.5px',
    })
  })
  value = value.replace(/==([^=]+)==/g, (_, text) =>
    inline('mark', text, {
      background: '#fff3b0',
      color: '#333',
      padding: '1px 4px',
      borderRadius: '3px',
    }),
  )
  value = value.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    const boldColor = theme?.boldColor || theme?.accent
    const boldMode = theme?.boldMode || 'default'
    if (boldMode === 'color') {
      return inline('strong', text, { color: boldColor })
    }
    if (boldMode === 'marker') {
      return inline('strong', text, {
        background: `linear-gradient(transparent 56%, ${alphaColor(boldColor, '40')} 0)`,
        padding: '0 2px',
        fontWeight: '700',
      })
    }
    if (boldMode === 'underline') {
      return inline('strong', text, {
        color: boldColor,
        borderBottom: `2px solid ${alphaColor(boldColor, '66')}`,
        fontWeight: '700',
      })
    }
    return theme?.boldColor
      ? inline('strong', text, { color: theme.boldColor })
      : inline('strong', text)
  })
  value = value.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Footnote references [^id]
  value = value.replace(/\[\^([^\]]+)\]/g, (_, id) => {
    const fnIndex = links
      .filter((item) => item.href.startsWith('fn:'))
      .findIndex((item) => item.href === `fn:${id}`)
    if (fnIndex >= 0) {
      return `<sup style="color:#888;font-size:12px;">[${fnIndex + 1}]</sup>`
    }
    return `[^${id}]`
  })

  return value
}

function isTableStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? ''
  const separatorLine = lines[index + 1] ?? ''
  return (
    index + 1 < lines.length &&
    /\|/.test(line) &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(separatorLine)
  )
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseTableAlignments(separatorLine: string): string[] {
  return separatorLine
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => {
      const c = cell.trim()
      if (c.startsWith(':') && c.endsWith(':')) return 'center'
      if (c.endsWith(':')) return 'right'
      return 'left'
    })
}

function paragraphStyle(theme: ThemeBase): Record<string, string | number> {
  const spacing = theme.paragraphSpacing ?? 1
  const marginBottom = Math.round(16 * spacing)
  const indent = typeof theme.textIndent === 'number' ? theme.textIndent : theme.textIndent ? 2 : 0
  const style: Record<string, string | number> = {
    margin: `0 0 ${marginBottom}px`,
    color: theme.color,
    fontSize: `${theme.fontSize || 16}px`,
    lineHeight: themeLineHeight(theme, 1.85),
  }
  if (indent > 0) {
    style.textIndent = `${indent}em`
  }
  if (theme.textJustify) {
    style.textAlign = 'justify'
  }
  if (theme.letterSpacing) {
    style.letterSpacing = theme.letterSpacing
  }
  return style
}

function themeFontSize(theme: ThemeBase, delta = 0): string {
  return `${(theme.fontSize || 16) + delta}px`
}

function themeLineHeight(theme: ThemeBase, fallback = 1.85): string {
  return String(theme.lineHeight || fallback)
}

function headingColorForLevel(theme: ThemeBase, level: number): string {
  if (level === 1) return theme.h1Color || theme.color
  if (level === 2) return theme.h2Color || theme.color
  if (level === 3) return theme.h3Color || theme.color
  if (level === 4) return theme.h4Color || theme.color
  return theme.color
}

function dividerColor(theme: ThemeBase): string {
  return theme.underlineColor || theme.headingAccent || theme.accent
}

/** @deprecated Kept for compatibility while theme components replace legacy style helpers. */
export function dividerStyle(theme: ThemeBase): Record<string, string | number | undefined> {
  const color = dividerColor(theme)
  const mode = theme.underlineMode || 'solid'
  const base = {
    border: '0',
    background: 'transparent',
    margin: '26px 0',
  }

  if (mode === 'dashed') {
    return {
      ...base,
      height: '0',
      borderTop: `1.5px dashed ${color}`,
    }
  }

  if (mode === 'double') {
    return {
      ...base,
      height: '5px',
      borderTop: `1px solid ${color}`,
      borderBottom: `1px solid ${color}`,
    }
  }

  if (mode === 'marker') {
    return {
      ...base,
      height: '8px',
      borderRadius: '999px',
      background: `linear-gradient(90deg, ${alphaColor(color, '00')} 0%, ${alphaColor(color, '66')} 50%, ${alphaColor(color, '00')} 100%)`,
    }
  }

  if (mode === 'wavy') {
    return {
      ...base,
      height: '7px',
      backgroundImage: `radial-gradient(circle at 4px 3px, ${color} 1.4px, transparent 1.8px)`,
      backgroundSize: '8px 7px',
      backgroundRepeat: 'repeat-x',
    }
  }

  return {
    ...base,
    height: '1.5px',
    background: color,
  }
}

/** @deprecated Kept for compatibility while theme components replace legacy style helpers. */
export function h1Style(theme: ThemeBase): Record<string, string | number | undefined> {
  const baseSize = theme.fontSize || 16
  const base = {
    margin: '0 0 24px',
    color: headingColorForLevel(theme, 1),
    fontSize: `${baseSize + 8}px`,
    lineHeight: '1.36',
    fontWeight: '700',
  }

  if (theme.h1Mode === 'center') {
    return {
      ...base,
      textAlign: 'center',
      padding: '8px 0 18px',
      borderBottom: `1px solid ${dividerColor(theme)}`,
    }
  }

  if (theme.h1Mode === 'panel') {
    return {
      ...base,
      padding: '18px 18px',
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      background: theme.bgSoft,
    }
  }

  if (theme.h1Mode === 'plain') {
    return {
      ...base,
      padding: '0 0 4px',
    }
  }

  if (theme.h1Mode === 'marker') {
    return {
      ...base,
      padding: '0 0 4px',
    }
  }

  if (theme.h1Mode === 'dash') {
    return {
      ...base,
      padding: '0 0 12px',
      borderBottom: `1.5px dashed ${theme.headingAccent || theme.accent}`,
    }
  }

  return {
    ...base,
    padding: '0 0 12px',
    borderBottom: `2px solid ${theme.headingAccent || theme.accent}`,
  }
}

function headingContent(content: string, theme: ThemeBase, mode = theme.headingMode): string {
  const hAccent = theme.headingAccent || theme.accent

  if (mode === 'marker') {
    return inline('span', content, {
      display: 'inline',
      padding: '0 2px',
      background: `linear-gradient(transparent 58%, ${alphaColor(hAccent, '38')} 0)`,
    })
  }

  if (mode === 'dash') {
    return inline('span', content, {
      display: 'inline-block',
      paddingBottom: '4px',
      borderBottom: `1.5px dashed ${hAccent}`,
    })
  }

  if (mode === 'chip') {
    return inline('span', content, {
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: '6px',
      background: theme.bgSoft,
      color: hAccent,
    })
  }

  if (mode === 'plain') {
    return inline('span', content, {
      display: 'inline-block',
      paddingBottom: '3px',
      borderBottom: `1px solid ${hAccent}`,
    })
  }

  return inline('span', content, {
    display: 'inline-block',
    paddingLeft: '10px',
    borderLeft: `4px solid ${hAccent}`,
  })
}

/** @deprecated Kept for compatibility while theme components replace legacy style helpers. */
export function h1Content(content: string, theme: ThemeBase): string {
  if (theme.h1Mode === 'marker' || theme.h1Mode === 'dash') {
    return headingContent(content, theme, theme.h1Mode)
  }
  return content
}

function quoteStyle(theme: ThemeBase): Record<string, string | number | undefined> {
  const qAccent = theme.quoteAccent || theme.accent
  const base = {
    margin: '0 0 18px',
    color: theme.muted,
    fontSize: themeFontSize(theme, -1),
    lineHeight: themeLineHeight(theme, 1.8),
  }

  if (theme.quoteMode === 'panel') {
    return {
      ...base,
      padding: '14px 18px',
      border: `1.5px solid ${theme.border}`,
      borderLeft: `5px solid ${qAccent}`,
      borderRadius: '0 8px 8px 0',
      background: theme.quoteBg,
    }
  }

  if (theme.quoteMode === 'soft') {
    return {
      ...base,
      padding: '13px 18px',
      borderRadius: '8px',
      background: theme.quoteBg,
      borderLeft: `3px solid ${qAccent}`,
    }
  }

  if (theme.quoteMode === 'outline') {
    return {
      ...base,
      padding: '13px 16px',
      border: `1.5px dashed ${qAccent}`,
      borderRadius: '8px',
      background: 'transparent',
    }
  }

  if (theme.quoteMode === 'note') {
    return {
      ...base,
      padding: '15px 17px',
      border: `1px solid ${theme.border}`,
      borderTop: `4px solid ${qAccent}`,
      borderRadius: '8px',
      background: theme.quoteBg,
      boxShadow: '0 6px 18px rgba(60, 44, 30, 0.08)',
    }
  }

  // bar (default) — 醒目左边线
  return {
    ...base,
    padding: '12px 16px',
    borderLeft: `4px solid ${qAccent}`,
    background: theme.quoteBg,
  }
}

function level2QuoteStyle(theme: ThemeBase): Record<string, string | number | undefined> {
  const qAccent = theme.quoteAccent || theme.accent
  const base = {
    margin: '0 0 8px',
    color: theme.muted,
    fontSize: themeFontSize(theme, -2),
  }

  if (theme.quoteMode2 === 'panel') {
    return {
      ...base,
      padding: '10px 14px',
      border: `1px dashed ${qAccent}`,
      borderRadius: '6px',
      background: theme.bgSoft,
      fontStyle: 'italic',
    }
  }

  if (theme.quoteMode2 === 'fade') {
    return {
      ...base,
      padding: '10px 14px',
      borderLeft: `2px solid ${qAccent}`,
      borderRadius: '4px',
      background: theme.bgSoft,
      opacity: '0.85',
    }
  }

  // bar (default) — 与 L1 不同的线型
  return {
    ...base,
    padding: '10px 14px',
    borderLeft: `2px dashed ${qAccent}`,
    borderRadius: '4px',
    background: theme.quoteBg,
  }
}

/** @deprecated Kept for compatibility while theme components replace legacy style helpers. */
export function renderNestedBlockquote(
  content: string,
  theme: ThemeBase,
  links: Array<{ label: string; href: string }>,
): string {
  const lines = content.split('\n')
  let maxDepth = 0
  const parsed: Array<{ depth: number; text: string }> = []

  for (const rawLine of lines) {
    let depth = 1
    let rest = rawLine
    while (/^>\s?/.test(rest)) {
      depth++
      rest = rest.replace(/^>\s?/, '')
    }
    if (depth > maxDepth) maxDepth = depth
    parsed.push({ depth, text: rest })
  }

  if (maxDepth <= 1) {
    // Simple single-level blockquote
    const paragraphs: string[] = []
    let buf: string[] = []
    for (const { text } of parsed) {
      if (!text.trim()) {
        if (buf.length) {
          paragraphs.push(buf.join(' '))
          buf = []
        }
      } else {
        buf.push(text)
      }
    }
    if (buf.length) paragraphs.push(buf.join(' '))
    const inner = paragraphs
      .map((p) =>
        inline('p', parseInline(p, links, theme), { ...paragraphStyle(theme), margin: '0 0 10px' }),
      )
      .join('')
    return inline('blockquote', inner, quoteStyle(theme))
  }

  // Nested: group lines by depth, render innermost first, wrap with level-2 then level-1
  const parts: string[] = []
  let buf: string[] = []
  let currentDepth = 1

  function flush(depth: number) {
    if (!buf.length) return
    const text = buf.join(' ')
    buf = []
    let html = inline('p', parseInline(text, links, theme), {
      ...paragraphStyle(theme),
      margin: '0 0 8px',
    })
    for (let d = depth; d < maxDepth; d++) {
      html = inline('blockquote', html, level2QuoteStyle(theme))
    }
    parts.push(html)
  }

  for (const { depth, text } of parsed) {
    if (!text.trim()) {
      flush(currentDepth)
    } else {
      if (depth !== currentDepth && buf.length) {
        flush(currentDepth)
      }
      currentDepth = depth
      buf.push(text)
    }
  }
  flush(currentDepth)

  // Wrap all parts in the outermost blockquote (level-1)
  let result = parts.join('')
  result = inline('blockquote', result, {
    ...quoteStyle(theme),
    margin: '0 0 18px',
  })
  return result
}

interface ListNode {
  type: string
  indent: number
  items: Array<{ text: string; childrenHtml: string }>
}

export function renderMarkdown(
  markdown: string,
  theme: ThemeBase,
  codeTheme: CodeTheme,
): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const article = analyzeArticle(markdown)
  const renderContext = createThemeRenderContext(theme, article)
  const links: Array<{ label: string; href: string }> = []
  const footnotes: Array<{ id: string; content: string }> = []
  let html = ''
  const paragraph: string[] = []
  let inCode = false
  let codeLang = ''
  const codeBuffer: string[] = []
  const listStack: ListNode[] = []
  let sectionIndex = 0
  let coverRendered = false

  // Pre-scan: collect footnote definitions
  const footnoteDefPattern = /^\[\^([^\]]+)\]:\s+(.+)$/
  const footnoteDefLines = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    const sourceLine = lines[i] ?? ''
    const m = sourceLine.trim().match(footnoteDefPattern)
    const id = m?.[1]
    const content = m?.[2]
    if (id && content) {
      footnotes.push({ id, content })
      footnoteDefLines.add(i)
      // Register as a link so references can find the index
      links.push({ label: `^${id}`, href: `fn:${id}` })
    }
  }

  const flushParagraph = () => {
    if (!paragraph.length) return
    html += inline('p', parseInline(paragraph.join(' '), links, theme), paragraphStyle(theme))
    paragraph.length = 0
  }

  function getListIndent(line: string): number {
    const m = line.match(/^(\s*)/)
    return m?.[1]?.length ?? 0
  }

  function renderListNode(list: ListNode): string {
    const items = list.items.map(
      (item) => parseInline(item.text, links, theme) + (item.childrenHtml || ''),
    )
    return renderList(items, list.type === 'ol', renderContext)
  }

  function appendChildList(listHtml: string) {
    const parent = listStack[listStack.length - 1]
    const lastItem = parent?.items[parent.items.length - 1]
    if (!lastItem) {
      html += listHtml
      return
    }
    lastItem.childrenHtml = (lastItem.childrenHtml || '') + listHtml
  }

  function flushListsAbove(indent: number) {
    while (listStack.length && (listStack[listStack.length - 1]?.indent ?? -1) > indent) {
      const list = listStack.pop()!
      const listHtml = renderListNode(list)
      if (listStack.length) {
        appendChildList(listHtml)
      } else {
        html += listHtml
      }
    }
  }

  function flushAllLists() {
    flushListsAbove(-1)
  }

  const flushCode = () => {
    const codeText = codeBuffer.join('\n')
    const langLabel = codeLang
      ? inline('span', escapeHtml(codeLang), {
          display: 'block',
          marginBottom: '8px',
          color: codeTheme.color,
          opacity: '0.64',
          fontSize: '12px',
          fontFamily: 'Menlo, Monaco, Consolas, monospace',
        })
      : ''

    // Mac-style traffic lights
    const macDots =
      theme.macCodeBlock !== false
        ? inline('span', '', {
            display: 'block',
            marginBottom: '10px',
          }) +
          '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff5f57;margin-right:7px;"></span>' +
          '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#febc2e;margin-right:7px;"></span>' +
          '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#28c840;"></span>'
        : ''

    const codeLines = codeText.split('\n')
    const codeBlock = codeLines
      .map((sourceLine, index) => {
        const normalized = sourceLine.replace(/^\s+/, (indent) => '　'.repeat(indent.replace(/\t/g, '    ').length))
        const number = theme.codeLineNumbers
          ? inline('span', String(index + 1), {
              display: 'inline-block',
              width: '2.2em',
              marginRight: '10px',
              color: codeTheme.color,
              opacity: '0.35',
              textAlign: 'right',
            })
          : ''
        return inline('p', number + (highlightCode(normalized, codeLang, codeTheme) || '<br>'), {
          margin: '0',
          minHeight: '1.7em',
          fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
          fontSize: '13px',
          lineHeight: '1.7',
          wordBreak: 'break-word',
        })
      })
      .join('')

    html += inline('section', macDots + langLabel + codeBlock, {
      margin: '0 0 20px',
      padding: '14px 15px',
      borderRadius: '6px',
      border: `1px solid ${codeTheme.border}`,
      background: codeTheme.background,
      color: codeTheme.color,
      overflowX: 'auto',
    })
    codeBuffer.length = 0
    codeLang = ''
  }

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? ''
    const line = raw.trim()

    // Skip footnote definitions (already pre-scanned)
    if (footnoteDefLines.has(i)) continue

    if (line.startsWith('```')) {
      if (inCode) {
        flushCode()
        inCode = false
      } else {
        flushParagraph()
        flushAllLists()
        inCode = true
        codeLang = line.replace(/^```/, '').trim()
      }
      continue
    }

    if (inCode) {
      codeBuffer.push(raw)
      continue
    }

    if (!line) {
      flushParagraph()
      flushAllLists()
      continue
    }

    const directive = /^:::\s*(lead|note|signature)(?:\s+(.+))?$/.exec(line)
    if (directive) {
      flushParagraph()
      flushAllLists()
      const kind = directive[1] || 'note'
      const title = directive[2] || ''
      const body: string[] = []
      let directiveIndex = i + 1
      while (directiveIndex < lines.length && (lines[directiveIndex] ?? '').trim() !== ':::') {
        body.push(lines[directiveIndex] ?? '')
        directiveIndex += 1
      }
      i = directiveIndex
      const content = body
        .join('\n')
        .split(/\n\s*\n/)
        .filter((part) => part.trim())
        .map((part) => inline('p', parseInline(part.replace(/\n/g, ' '), links, theme), paragraphStyle(theme)))
        .join('')
      html += renderCallout(kind, parseInline(title, links, theme), content, renderContext)
      continue
    }

    const imageOnly = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.exec(line)
    if (imageOnly) {
      flushParagraph()
      flushAllLists()
      const alt = imageOnly[1] ?? ''
      const safeSrc = safeUrl(imageOnly[2] ?? '')
      if (safeSrc) {
        const image = selfClosing(
          'img',
          { display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' },
          { src: safeSrc, alt },
        )
        html += renderImage(image, escapeHtml(alt), renderContext)
      } else {
        html += inline('p', escapeHtml(line), paragraphStyle(theme))
      }
      continue
    }

    if (isTableStart(lines, i)) {
      flushParagraph()
      flushAllLists()
      const headers = splitTableRow(lines[i] ?? '')
      const alignments = parseTableAlignments(lines[i + 1] ?? '')
      i += 2
      const rows: string[][] = []
      while (i < lines.length) {
        const rowLine = lines[i] ?? ''
        if (!/\|/.test(rowLine) || !rowLine.trim()) break
        rows.push(splitTableRow(rowLine))
        i += 1
      }
      i -= 1
      const ths = headers
        .map((cell, ci) =>
          inline('th', parseInline(cell, links, theme), {
            padding: '9px 8px',
            border: `1px solid ${theme.border}`,
            background:
              renderContext.design.table === 'ledger'
                ? theme.color
                : renderContext.design.table === 'grid'
                  ? theme.accent
                  : theme.bgSoft,
            color:
              renderContext.design.table === 'ledger' || renderContext.design.table === 'grid'
                ? theme.canvas || '#ffffff'
                : theme.color,
            fontWeight: '700',
            fontSize: '14px',
            lineHeight: '1.5',
            textAlign: alignments[ci] || 'left',
          }),
        )
        .join('')
      const trs = rows
        .map((row, rowIndex) =>
          inline(
            'tr',
            row
              .map((cell, ci) =>
                inline('td', parseInline(cell, links, theme), {
                  padding: '9px 8px',
                  border: `1px solid ${theme.border}`,
                  color: theme.color,
                  background:
                    renderContext.design.table === 'striped' && rowIndex % 2 === 1
                      ? theme.bgSoft
                      : theme.canvas,
                  fontSize: '14px',
                  lineHeight: '1.55',
                  textAlign: alignments[ci] || 'left',
                }),
              )
              .join(''),
          ),
        )
        .join('')
      const tableHtml = inline('table', inline('thead', inline('tr', ths)) + inline('tbody', trs), {
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        })
      html += renderTable(tableHtml, renderContext)
      continue
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushAllLists()
      const level = (heading[1] ?? '').length
      const content = parseInline(heading[2] ?? '', links, theme)
      if (level === 1) {
        html += renderCover(content, renderContext)
        html += renderToc(renderContext)
        coverRendered = true
      } else {
        if (level === 2) sectionIndex += 1
        html += renderSectionHeading(content, level, sectionIndex, renderContext)
      }
      continue
    }

    if (/^>\s?/.test(line)) {
      flushParagraph()
      flushAllLists()
      // Collect consecutive blockquote lines, support nesting
      const quoteLines: string[] = [line.replace(/^>\s?/, '')]
      let qi = i + 1
      while (qi < lines.length) {
        const quoteLine = (lines[qi] ?? '').trim()
        if (quoteLine === '>') {
          quoteLines.push('')
          qi += 1
          continue
        }
        if (!/^>\s?/.test(quoteLine)) break
        quoteLines.push(quoteLine.replace(/^>\s?/, ''))
        qi += 1
      }
      i = qi - 1

      const quoteContent = quoteLines
        .map((quoteLine) => quoteLine.replace(/^>\s?/, ''))
        .filter((quoteLine) => quoteLine.trim())
        .map((quoteLine) => inline('p', parseInline(quoteLine, links, theme), { margin: '0 0 8px' }))
        .join('')
      html += renderQuote(quoteContent, renderContext)
      continue
    }

    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushParagraph()
      flushAllLists()
      html += renderDivider(renderContext)
      continue
    }

    const task = /^(\s*)[-*+]\s+\[([ xX])]\s+(.+)$/.exec(raw)
    const unordered = /^(\s*)[-*+]\s+(.+)$/.exec(raw)
    const ordered = /^(\s*)\d+\.\s+(.+)$/.exec(raw)
    if (task || unordered || ordered) {
      flushParagraph()
      const indent = getListIndent(raw)
      const currentType = ordered ? 'ol' : 'ul'
      let content: string
      if (task) {
        const checked = /x/i.test(task[2] ?? '')
        content = `${checked ? '☑' : '☐'} ${task[3] ?? ''}`
      } else {
        content = unordered?.[2] ?? ordered?.[2] ?? ''
      }

      flushListsAbove(indent)

      if (!listStack.length) {
        listStack.push({ type: currentType, indent, items: [{ text: content, childrenHtml: '' }] })
      } else {
        const top = listStack[listStack.length - 1]
        if (!top) {
          listStack.push({
            type: currentType,
            indent,
            items: [{ text: content, childrenHtml: '' }],
          })
        } else if (top.indent === indent) {
          if (top.type === currentType) {
            top.items.push({ text: content, childrenHtml: '' })
          } else {
            const list = listStack.pop()!
            const listHtml = renderListNode(list)
            if (listStack.length) {
              appendChildList(listHtml)
            } else {
              html += listHtml
            }
            listStack.push({
              type: currentType,
              indent,
              items: [{ text: content, childrenHtml: '' }],
            })
          }
        } else if (top.indent < indent) {
          listStack.push({
            type: currentType,
            indent,
            items: [{ text: content, childrenHtml: '' }],
          })
        } else {
          flushAllLists()
          listStack.push({
            type: currentType,
            indent,
            items: [{ text: content, childrenHtml: '' }],
          })
        }
      }
      continue
    }

    flushAllLists()
    paragraph.push(line)
  }

  if (inCode) flushCode()
  flushParagraph()
  flushAllLists()

  if (links.length) {
    const linkItems = links
      .filter((item) => !item.href.startsWith('fn:'))
      .map((item, index) =>
        inline('p', `[${index + 1}] ${escapeHtml(item.label)}：${escapeHtml(item.href)}`, {
          margin: '0 0 7px',
          color: theme.muted,
          fontSize: '13px',
          lineHeight: '1.6',
          wordBreak: 'break-all',
        }),
      )
      .join('')
    if (linkItems) {
      html += inline(
        'section',
        inline('p', '参考链接', {
          margin: '0 0 9px',
          color: theme.color,
          fontSize: '14px',
          fontWeight: '700',
        }) + linkItems,
        {
          margin: '28px 0 0',
          padding: '12px 0 0',
          borderTop: `1px solid ${theme.border}`,
        },
      )
    }
  }

  // Render footnotes section
  if (footnotes.length) {
    const footnoteItems = footnotes
      .map((fn, index) =>
        inline(
          'p',
          `<span style="color:${theme.muted};font-size:12px;margin-right:4px;">[${index + 1}]</span> ${parseInline(fn.content, links, theme)}`,
          {
            margin: '0 0 6px',
            color: theme.muted,
            fontSize: '13px',
            lineHeight: '1.6',
          },
        ),
      )
      .join('')
    html += inline(
      'section',
      inline('p', '注释', {
        margin: '0 0 9px',
        color: theme.color,
        fontSize: '14px',
        fontWeight: '700',
      }) + footnoteItems,
      {
        margin: '20px 0 0',
        padding: '12px 0 0',
        borderTop: `1px solid ${theme.border}`,
      },
    )
  }

  const pageMargin = Number(theme.pageMargin ?? 0)
  const hasPagePadding = Number.isFinite(pageMargin) && pageMargin > 0
  if (coverRendered || html.trim()) html += renderEndMark(renderContext)

  return leafifyHtml(inline(
    'section',
    html || inline('p', '开始输入 Markdown，右侧会实时预览。', paragraphStyle(theme)),
    {
      color: theme.color,
      fontFamily: theme.fontFamily,
      background: theme.canvas,
      padding: hasPagePadding
        ? `18px ${pageMargin}px`
        : theme.canvas
          ? '18px'
          : undefined,
      borderRadius: theme.canvas ? '8px' : undefined,
      fontSize: `${theme.fontSize || 16}px`,
      lineHeight: themeLineHeight(theme, 1.8),
    },
  ))
}
