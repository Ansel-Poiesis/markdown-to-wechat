import type { CodeTheme, ThemeBase } from '@/types'
import { analyzeArticle, closingCodeFence, openingCodeFence } from '@/utils/articleStructure'
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

export const MARKDOWN_RENDER_LIMITS = {
  inputChars: 2 * 1024 * 1024,
  htmlChars: 4 * 1024 * 1024,
  inlineTokens: 10000,
  structuredTokens: 20000,
  lines: 50000,
} as const

export class MarkdownRenderLimitError extends Error {
  readonly code = 'MARKDOWN_RENDER_LIMIT'
  constructor(detail: string) {
    super(`文章超出安全渲染预算（${detail}），请拆分文章或减少格式标记后重试。原稿未被修改。`)
    this.name = 'MarkdownRenderLimitError'
  }
}

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
  const styleAttr = Object.keys(style).length ? ` style="${escapeHtml(styleText(style))}"` : ''
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
  const styleAttr = Object.keys(style).length ? ` style="${escapeHtml(styleText(style))}"` : ''
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
  consumeToken?: () => void,
): string {
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
  const aliases: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    rs: 'rust',
    golang: 'go',
    xml: 'html',
  }
  const language = (lang || 'js').toLowerCase()
  const normalized = aliases[language] || language
  if (!keywordSets[normalized]) return escapeHtml(code)
  const keywords = new Set(keywordSets[normalized].split(' '))
  const tokenPattern = /\d+(?:\.\d+)?|[A-Za-z_$][\w$-]*/y
  const result: string[] = []
  let cursor = 0
  let plainStart = 0
  while (cursor < code.length) {
    let end = cursor
    let tokenColor = ''
    let keyword = false
    const blockEnd =
      code.startsWith('<!--', cursor) && normalized === 'html'
        ? '-->'
        : code.startsWith('/*', cursor) && !['python', 'bash', 'yaml', 'json'].includes(normalized)
          ? '*/'
          : ''
    const lineComment =
      (code.startsWith('//', cursor) && ['js', 'ts', 'go', 'rust'].includes(normalized)) ||
      (code[cursor] === '#' && ['python', 'bash', 'yaml'].includes(normalized)) ||
      (code.startsWith('--', cursor) && normalized === 'sql')
    if (blockEnd) {
      const closing = code.indexOf(blockEnd, cursor + (blockEnd === '-->' ? 4 : 2))
      end = closing < 0 ? code.length : closing + blockEnd.length
      tokenColor = commentColor
    } else if (lineComment) {
      const newline = code.indexOf('\n', cursor)
      end = newline < 0 ? code.length : newline
      tokenColor = commentColor
    } else if (/^["'`]$/.test(code[cursor]!)) {
      const quote = code[cursor]
      end = cursor + 1
      while (end < code.length) {
        if (code[end] === '\\') {
          end = Math.min(end + 2, code.length)
          continue
        }
        if (code[end] === quote) {
          end += 1
          break
        }
        if (quote !== '`' && code[end] === '\n') break
        end += 1
      }
      tokenColor = stringColor
    } else {
      tokenPattern.lastIndex = cursor
      const match = tokenPattern.exec(code)
      if (match) {
        end = cursor + match[0].length
        keyword = keywords.has(normalized === 'sql' ? match[0].toLowerCase() : match[0])
        tokenColor = /^\d/.test(match[0]) ? numberColor : keyword ? color : ''
      }
    }
    if (end === cursor) {
      cursor += 1
      continue
    }
    if (tokenColor) consumeToken?.()
    result.push(escapeHtml(code.slice(plainStart, cursor)))
    const token = code.slice(cursor, end)
    result.push(
      tokenColor
        ? token
            .split('\n')
            .map((line) =>
              inline('span', escapeHtml(line), {
                color: tokenColor,
                fontWeight: keyword ? '700' : undefined,
              }),
            )
            .join('\n')
        : escapeHtml(token),
    )
    cursor = end
    plainStart = end
  }
  return result.join('') + escapeHtml(code.slice(plainStart))
}

export function safeUrl(url: string): string {
  if (!url) return ''
  const allowed = ['http:', 'https:', 'mailto:']
  try {
    const parsed = new URL(url, 'https://localhost/')
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

interface LinkRegistry {
  external: Array<{ label: string; href: string }>
  externalIndex: Map<string, number>
  footnoteIndex: Map<string, number>
  inlineTokens: number
  structuredTokens: number
}

function consumeRenderToken(links: LinkRegistry, inlineToken = false, count = 1): void {
  links.structuredTokens += count
  if (links.structuredTokens > MARKDOWN_RENDER_LIMITS.structuredTokens) {
    throw new MarkdownRenderLimitError('结构节点超过 20,000 个')
  }
  if (inlineToken) links.inlineTokens += count
  if (links.inlineTokens > MARKDOWN_RENDER_LIMITS.inlineTokens) {
    throw new MarkdownRenderLimitError('行内格式超过 10,000 个')
  }
}

// Match delimiters once. Repeated failed links/backticks must not rescan the tail.
function inlineDelimiters(text: string): Map<number, number> {
  const pairs = new Map<number, number>()
  const previousTick = new Map<number, number>()
  for (const tick of text.matchAll(/`+/g)) {
    const previous = previousTick.get(tick[0].length)
    if (previous !== undefined) pairs.set(previous, tick.index)
    previousTick.set(tick[0].length, tick.index)
  }
  const brackets: number[] = []
  const parentheses: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '\\') {
      i += 1
      continue
    }
    if (char === '`' && pairs.has(i)) {
      const end = pairs.get(i)!
      let length = 1
      while (text[i + length] === '`') length += 1
      i = end + length - 1
      continue
    }
    if (char === '[') brackets.push(i)
    if (char === ']' && brackets.length) pairs.set(brackets.pop()!, i)
    if (char === '(') parentheses.push(i)
    if (char === ')' && parentheses.length) pairs.set(parentheses.pop()!, i)
  }
  return pairs
}

function unescapeMarkdown(value: string): string {
  return value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1')
}

function parseInline(
  text: string,
  links: LinkRegistry,
  theme?: ThemeBase,
  linkMode: 'footnote' | 'inline' = 'footnote',
  depth = 0,
): string {
  if (depth >= 16) return escapeHtml(text)
  // HTML parsers replace NUL with U+FFFD. Normalize it before reserving a sentinel,
  // so hostile marker-like source cannot trigger a growing-prefix search.
  text = text.replaceAll('\u0000', '\uFFFD')
  const pairs = inlineDelimiters(text)
  const tokens: string[] = []
  const marker = '\u0000MD'
  const stash = (html: string) => {
    consumeRenderToken(links, true)
    return `${marker}${tokens.push(html) - 1}\u0000`
  }
  const parts: string[] = []
  let cursor = 0
  let plainStart = 0
  const consume = (end: number, html: string) => {
    parts.push(escapeHtml(text.slice(plainStart, cursor)), stash(html))
    cursor = end
    plainStart = end
  }
  while (cursor < text.length) {
    const char = text[cursor]
    if (char === '\\' && /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(text[cursor + 1] || '')) {
      consume(cursor + 2, escapeHtml(text[cursor + 1]!))
      continue
    }
    if (char === '`') {
      let length = 1
      while (text[cursor + length] === '`') length += 1
      const end = pairs.get(cursor)
      if (end !== undefined) {
        let code = text.slice(cursor + length, end).replace(/\n/g, ' ')
        if (code.startsWith(' ') && code.endsWith(' ') && /[^ ]/.test(code))
          code = code.slice(1, -1)
        consume(
          end + length,
          inline('code', escapeHtml(code), {
            padding: '2px 5px',
            borderRadius: '4px',
            background: '#f0f2f4',
            color: '#c43d3d',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            fontSize: '0.92em',
          }),
        )
      } else cursor += length
      continue
    }
    const image = char === '!' && text[cursor + 1] === '['
    const start = image ? cursor + 1 : cursor
    if (image || char === '[') {
      const labelEnd = pairs.get(start)
      if (labelEnd !== undefined) {
        const rawLabel = text.slice(start + 1, labelEnd)
        const targetEnd = text[labelEnd + 1] === '(' ? pairs.get(labelEnd + 1) : undefined
        if (targetEnd !== undefined) {
          const target = text.slice(labelEnd + 2, targetEnd).trim()
          const match = /^(?:<([^<>\n]*)>|(\S+?))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?$/.exec(
            target,
          )
          const href = match ? safeUrl(unescapeMarkdown(match[1] ?? match[2] ?? '')) : ''
          if (!href) consume(targetEnd + 1, escapeHtml(text.slice(cursor, targetEnd + 1)))
          else if (image)
            consume(
              targetEnd + 1,
              imageHtml(unescapeMarkdown(rawLabel), href, {
                ...loadImageSettings(),
                caption: false,
              }),
            )
          else {
            const label = parseInline(rawLabel, links, theme, linkMode, depth + 1)
            if (linkMode === 'inline')
              consume(
                targetEnd + 1,
                label.includes('<a ')
                  ? '[' + label + escapeHtml(text.slice(labelEnd, targetEnd + 1))
                  : `<a href="${escapeHtml(href)}">${label}</a>`,
              )
            else {
              let index = links.externalIndex.get(href)
              if (index === undefined) {
                index = links.external.length + 1
                links.externalIndex.set(href, index)
                links.external.push({ label: unescapeMarkdown(rawLabel), href })
              }
              consume(
                targetEnd + 1,
                `${label}<sup style="color:#888;font-size:12px;">[${index}]</sup>`,
              )
            }
          }
          continue
        }
        if (!image && rawLabel.startsWith('^')) {
          const index = links.footnoteIndex.get(rawLabel.slice(1))
          if (index !== undefined) {
            consume(labelEnd + 1, `<sup style="color:#888;font-size:12px;">[${index}]</sup>`)
            continue
          }
        }
      }
    }
    cursor += 1
  }
  parts.push(escapeHtml(text.slice(plainStart)))
  let value = parts.join('')
  value = value.replace(/~~([^~]+)~~/g, (_, content) => {
    consumeRenderToken(links, true)
    return `<del>${content}</del>`
  })
  value = value.replace(/__([^_]+)__/g, (_, text) => {
    consumeRenderToken(links, true)
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
  value = value.replace(/==([^=]+)==/g, (_, text) => {
    consumeRenderToken(links, true)
    return inline('mark', text, {
      background: '#fff3b0',
      color: '#333',
      padding: '1px 4px',
      borderRadius: '3px',
    })
  })
  value = value.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    consumeRenderToken(links, true)
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
  value = value.replace(/\*([^*]+)\*/g, (_, content) => {
    consumeRenderToken(links, true)
    return `<em>${content}</em>`
  })

  return value.replace(
    new RegExp(`${marker}(\\d+)\u0000`, 'g'),
    (_, index) => tokens[Number(index)] || '',
  )
}

function isTableStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? ''
  const separatorLine = lines[index + 1] ?? ''
  return (
    index + 1 < lines.length &&
    /\|/.test(line) &&
    splitTableRow(line).length === splitTableRow(separatorLine).length &&
    splitTableRow(separatorLine).every((cell) => /^:?-{3,}:?$/.test(cell))
  )
}

function splitTableRow(line: string): string[] {
  const value = line.trim().replace(/^\|/, '')
  const pairs = inlineDelimiters(value)
  const cells: string[] = []
  let start = 0
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\\') {
      i += 1
      continue
    }
    if (value[i] === '`' && pairs.has(i)) {
      let length = 1
      while (value[i + length] === '`') length += 1
      i = pairs.get(i)! + length - 1
      continue
    }
    if (value[i] === '|') {
      cells.push(value.slice(start, i).trim())
      start = i + 1
    }
  }
  if (start < value.length || !cells.length) cells.push(value.slice(start).trim())
  return cells
}

function parseTableAlignments(separatorLine: string): string[] {
  return splitTableRow(separatorLine).map((cell) => {
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

function themeLineHeight(theme: ThemeBase, fallback = 1.85): string {
  return String(theme.lineHeight || fallback)
}

interface ListNode {
  type: string
  indent: number
  start: number
  items: Array<{ text: string; childrenHtml: string }>
}

export function renderMarkdown(
  markdown: string,
  theme: ThemeBase,
  codeTheme: CodeTheme,
  options: { linkMode?: 'footnote' | 'inline'; leafify?: boolean } = {},
): string {
  if (markdown.length > MARKDOWN_RENDER_LIMITS.inputChars) {
    throw new MarkdownRenderLimitError('原稿超过 2 Mi 个字符')
  }
  const linkMode = options.linkMode ?? 'footnote'
  const leafify = options.leafify ?? true
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  if (lines.length > MARKDOWN_RENDER_LIMITS.lines)
    throw new MarkdownRenderLimitError('原稿超过 50,000 行')
  const article = analyzeArticle(markdown)
  const renderContext = createThemeRenderContext(theme, article)
  const links: LinkRegistry = {
    external: [],
    externalIndex: new Map(),
    footnoteIndex: new Map(),
    inlineTokens: 0,
    structuredTokens: 0,
  }
  const footnotes: Array<{ id: string; content: string }> = []
  let html = ''
  const paragraph: string[] = []
  let fence: ReturnType<typeof openingCodeFence>
  let codeLang = ''
  const codeBuffer: string[] = []
  const listStack: ListNode[] = []
  let sectionIndex = 0
  let coverRendered = false

  // Pre-scan: collect footnote definitions
  const footnoteDefPattern = /^\[\^([^\]]+)\]:\s+(.+)$/
  const footnoteDefLines = new Set<number>()
  let scanFence: ReturnType<typeof openingCodeFence>
  let scanDirective = false
  for (let i = 0; i < lines.length; i++) {
    const sourceLine = lines[i] ?? ''
    if (scanFence) {
      if (closingCodeFence(sourceLine, scanFence)) scanFence = undefined
      continue
    }
    if (scanDirective) {
      if (sourceLine.trim() === ':::') scanDirective = false
      continue
    }
    scanFence = openingCodeFence(sourceLine)
    if (scanFence) continue
    if (/^:::\s*(lead|note|signature)(?:\s+.+)?$/.test(sourceLine.trim())) {
      scanDirective = true
      continue
    }
    const m = sourceLine.trim().match(footnoteDefPattern)
    const id = m?.[1]
    const content = m?.[2]
    if (id && content) {
      consumeRenderToken(links)
      footnoteDefLines.add(i)
      if (!links.footnoteIndex.has(id)) {
        footnotes.push({ id, content })
        links.footnoteIndex.set(id, footnotes.length)
      }
    }
  }

  const flushParagraph = () => {
    if (!paragraph.length) return
    consumeRenderToken(links)
    html += inline(
      'p',
      parseInline(paragraph.join(' '), links, theme, linkMode),
      paragraphStyle(theme),
    )
    paragraph.length = 0
  }

  function getListIndent(line: string): number {
    const m = line.match(/^(\s*)/)
    return m?.[1]?.length ?? 0
  }

  function renderListNode(list: ListNode): string {
    const items = list.items.map((item) => item.text + (item.childrenHtml || ''))
    return renderList(items, list.type === 'ol', renderContext, list.start)
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

    const codeLines = highlightCode(codeText, codeLang, codeTheme, () =>
      consumeRenderToken(links, true),
    ).split('\n')
    const codeBlock = codeLines
      .map((sourceLine, index) => {
        consumeRenderToken(links)
        // WeChat strips white-space:pre. Preserve every visible space in text
        // segments, including inside strings/comments, without changing tag attributes.
        const normalized = sourceLine
          .split(/(<[^>]*>)/g)
          .map((part) =>
            part.startsWith('<')
              ? part
              : part.replace(/ /g, '&#160;').replace(/\t/g, '&#160;'.repeat(4)),
          )
          .join('')
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
        return inline('p', number + (normalized || '<br>'), {
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
    if (html.length > MARKDOWN_RENDER_LIMITS.htmlChars)
      throw new MarkdownRenderLimitError('生成 HTML 超过 4 Mi 个字符')
    const raw = lines[i] ?? ''
    const line = raw.trim()

    // Skip footnote definitions (already pre-scanned)
    if (footnoteDefLines.has(i)) continue

    if (fence) {
      if (closingCodeFence(raw, fence)) {
        flushCode()
        fence = undefined
      } else {
        codeBuffer.push(raw)
      }
      continue
    }
    fence = openingCodeFence(raw)
    if (fence) {
      flushParagraph()
      flushAllLists()
      codeLang = fence.language
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
        .map((part) => {
          consumeRenderToken(links)
          return inline(
            'p',
            parseInline(part.replace(/\n/g, ' '), links, theme, linkMode),
            paragraphStyle(theme),
          )
        })
        .join('')
      html += renderCallout(
        kind,
        parseInline(title, links, theme, linkMode),
        content,
        renderContext,
      )
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
      consumeRenderToken(links, false, headers.length)
      const alignments = parseTableAlignments(lines[i + 1] ?? '')
      i += 2
      const rows: string[][] = []
      while (i < lines.length) {
        const rowLine = lines[i] ?? ''
        if (!/\|/.test(rowLine) || !rowLine.trim()) break
        // Charge padded cells before allocating them: a wide header plus many
        // short rows can otherwise allocate H * R cells from a tiny input.
        consumeRenderToken(links, false, headers.length)
        const row = splitTableRow(rowLine)
        rows.push(headers.map((_header, index) => row[index] || ''))
        i += 1
      }
      i -= 1
      const ths = headers
        .map((cell, ci) => {
          return inline('th', parseInline(cell, links, theme, linkMode), {
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
          })
        })
        .join('')
      const trs = rows
        .map((row, rowIndex) =>
          inline(
            'tr',
            row
              .map((cell, ci) => {
                return inline('td', parseInline(cell, links, theme, linkMode), {
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
                })
              })
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
      consumeRenderToken(links)
      flushParagraph()
      flushAllLists()
      const level = (heading[1] ?? '').length
      const content = parseInline(heading[2] ?? '', links, theme, linkMode)
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

      const nestedQuote = (contentLines: string[], depth: number): string => {
        const content: string[] = []
        for (let index = 0; index < contentLines.length; index += 1) {
          const quoteLine = contentLines[index] || ''
          if (/^>\s?/.test(quoteLine) && depth < 32) {
            const nested: string[] = []
            while (index < contentLines.length && /^>\s?/.test(contentLines[index] || '')) {
              nested.push(contentLines[index]!.replace(/^>\s?/, ''))
              index += 1
            }
            index -= 1
            content.push(nestedQuote(nested, depth + 1))
          } else if (quoteLine.trim()) {
            consumeRenderToken(links)
            content.push(
              inline('p', parseInline(quoteLine, links, theme, linkMode), { margin: '0 0 8px' }),
            )
          }
        }
        return renderQuote(content.join(''), renderContext)
      }
      html += nestedQuote(quoteLines, 1)
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
    const ordered = /^(\s*)\d{1,9}[.)]\s+(.+)$/.exec(raw)
    if (task || unordered || ordered) {
      consumeRenderToken(links)
      flushParagraph()
      const indent = getListIndent(raw)
      const currentType = ordered ? 'ol' : 'ul'
      const start = ordered ? Number.parseInt(raw.trim(), 10) : 1
      let content: string
      if (task) {
        const checked = /x/i.test(task[2] ?? '')
        content = `${checked ? '☑' : '☐'} ${task[3] ?? ''}`
      } else {
        content = unordered?.[2] ?? ordered?.[2] ?? ''
      }
      // Assign link numbers in source order, before nested children are flushed.
      content = parseInline(content, links, theme, linkMode)

      flushListsAbove(indent)

      if (!listStack.length) {
        listStack.push({
          type: currentType,
          indent,
          start,
          items: [{ text: content, childrenHtml: '' }],
        })
      } else {
        const top = listStack[listStack.length - 1]
        if (!top) {
          listStack.push({
            type: currentType,
            indent,
            start,
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
              start,
              items: [{ text: content, childrenHtml: '' }],
            })
          }
        } else if (top.indent < indent) {
          listStack.push({
            type: currentType,
            indent,
            start,
            items: [{ text: content, childrenHtml: '' }],
          })
        } else {
          flushAllLists()
          listStack.push({
            type: currentType,
            indent,
            start,
            items: [{ text: content, childrenHtml: '' }],
          })
        }
      }
      continue
    }

    flushAllLists()
    paragraph.push(line)
  }

  if (fence) flushCode()
  flushParagraph()
  flushAllLists()

  // Parse notes before producing the link appendix: notes can add external references too.
  const renderedFootnotes = footnotes.map((fn) => parseInline(fn.content, links, theme, linkMode))
  if (linkMode === 'footnote' && links.external.length) {
    const linkItems = links.external
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
      .map((_fn, index) =>
        inline(
          'p',
          `${inline('span', `[${index + 1}]`, { color: theme.muted, fontSize: '12px', marginRight: '4px' })} ${renderedFootnotes[index]}`,
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

  const body = inline(
    'section',
    html || inline('p', '开始输入 Markdown，右侧会实时预览。', paragraphStyle(theme)),
    {
      color: theme.color,
      fontFamily: theme.fontFamily,
      background: theme.canvas,
      padding: hasPagePadding ? `18px ${pageMargin}px` : theme.canvas ? '18px' : undefined,
      borderRadius: theme.canvas ? '8px' : undefined,
      fontSize: `${theme.fontSize || 16}px`,
      lineHeight: themeLineHeight(theme, 1.8),
    },
  )
  if (body.length > MARKDOWN_RENDER_LIMITS.htmlChars)
    throw new MarkdownRenderLimitError('生成 HTML 超过 4 Mi 个字符')
  return leafify ? leafifyHtml(body) : body
}
