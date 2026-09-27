import type { WarningItem } from '@/types'
import { parseFragment, type DefaultTreeAdapterTypes, type ParserError } from 'parse5'

const FORBIDDEN: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /position\s*:\s*(fixed|absolute|sticky)/i,
    message: '最终 HTML 使用了公众号不支持的定位。',
  },
  { pattern: /float\s*:/i, message: '最终 HTML 使用了公众号不支持的 float。' },
  { pattern: /display\s*:\s*grid/i, message: '最终 HTML 使用了 display:grid。' },
  { pattern: /var\s*\(\s*--/i, message: '最终 HTML 使用了 CSS 变量。' },
  { pattern: /@(media|keyframes|import)/i, message: '最终 HTML 使用了公众号会过滤的 CSS 规则。' },
  {
    pattern: /url\s*\(\s*['"]?https?:\/\/[^)]*\.(woff2?|ttf|otf|eot)/i,
    message: '最终 HTML 引用了外部字体。',
  },
  {
    pattern: /white-space\s*:\s*pre/i,
    message: '代码块使用 white-space:pre，微信中可能出现异常空白。',
  },
]

const ALLOWED_TAGS = new Set([
  'section',
  'p',
  'span',
  'strong',
  'em',
  'del',
  'mark',
  'code',
  'sup',
  'blockquote',
  'figure',
  'figcaption',
  'img',
  'br',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
])
const ALLOWED_ATTRIBUTES = new Set(['style', 'leaf', 'src', 'alt', 'colspan', 'rowspan'])
const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SAFE_CSS_FUNCTIONS = new Set([
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'linear-gradient',
  'repeating-linear-gradient',
  'radial-gradient',
  'calc',
  'min',
  'max',
  'clamp',
])

export interface WechatHtmlValidation {
  valid: boolean
  issues: WarningItem[]
  leafCount: number
}

export function leafifyHtml(html: string): string {
  // A greater-than sign inside a quoted attribute is not the end of a tag.
  const tokens: string[] = []
  let start = 0
  for (let index = 0; index < html.length; index += 1) {
    if (html[index] !== '<') continue
    if (index > start) tokens.push(html.slice(start, index))
    start = index
    let quote = ''
    for (index += 1; index < html.length; index += 1) {
      const character = html[index]
      if (quote) {
        if (character === quote) quote = ''
      } else if (character === '"' || character === "'") {
        quote = character
      } else if (character === '>') {
        break
      }
    }
    tokens.push(html.slice(start, index + 1))
    start = index + 1
  }
  if (start < html.length) tokens.push(html.slice(start))
  const stack: Array<{ tag: string; leaf: boolean }> = []
  let leafDepth = 0

  return tokens
    .map((token) => {
      if (!token) return ''
      if (!token.startsWith('<')) {
        if (!token.trim() || leafDepth > 0) return token
        return `<span leaf="">${token}</span>`
      }
      if (token.startsWith('</')) {
        const tagName = token.match(/^<\/\s*([a-z0-9]+)/i)?.[1]?.toLowerCase()
        for (let index = stack.length - 1; index >= 0; index -= 1) {
          const entry = stack[index]
          if (entry?.tag !== tagName) continue
          const removed = stack.splice(index)
          leafDepth -= removed.filter((item) => item.leaf).length
          break
        }
        return token
      }
      if (/^<!|^<\?|\/>$/.test(token)) return token
      const tagName = token.match(/^<\s*([a-z0-9]+)/i)?.[1]?.toLowerCase()
      if (!tagName || ['img', 'br', 'hr', 'meta', 'link', 'input'].includes(tagName)) return token
      const isLeaf = tagName === 'span' && /\sleaf(?:\s*=|[\s>])/.test(token)
      stack.push({ tag: tagName, leaf: isLeaf })
      if (isLeaf) leafDepth += 1
      return token
    })
    .join('')
}

export function validateWechatHtml(html: string): WechatHtmlValidation {
  const issues: WarningItem[] = []
  const parseErrors: ParserError[] = []
  const fragment = parseFragment(html, { onParseError: (error) => parseErrors.push(error) })
  if (parseErrors.length > 0) {
    const first = parseErrors[0]
    issues.push({
      level: 'danger',
      text: `最终 HTML 结构异常（${first?.code || 'parse-error'}），请勿复制。`,
      type: 'htmlCompatibility',
    })
  }
  const structure = inspectTree(fragment)
  issues.push(...structure.issues)
  const leafCount = structure.leafCount
  if (structure.unwrappedCjkCount > 0 && leafCount === 0) {
    issues.push({
      level: 'danger',
      text: '最终 HTML 没有 span leaf 包裹，粘贴后样式可能大面积丢失。',
      type: 'htmlCompatibility',
    })
  }
  const unwrappedCount = structure.unwrappedCjkCount
  if (unwrappedCount > 0) {
    issues.push({
      level: 'danger',
      text: `最终 HTML 有 ${unwrappedCount} 处中文文字未使用 span leaf 包裹。`,
      type: 'htmlCompatibility',
    })
  }
  return { valid: !issues.some((issue) => issue.level === 'danger'), issues, leafCount }
}

function inspectTree(fragment: DefaultTreeAdapterTypes.DocumentFragment): {
  issues: WarningItem[]
  leafCount: number
  unwrappedCjkCount: number
} {
  const issues: WarningItem[] = []
  const invalidTags = new Set<string>()
  const invalidAttributes = new Set<string>()
  const invalidAttributeValues = new Set<string>()
  let leafCount = 0
  let unwrappedCjkCount = 0

  const pending: Array<{ node: DefaultTreeAdapterTypes.Node; insideLeaf: boolean }> =
    fragment.childNodes.map((node) => ({ node, insideLeaf: false }))
  while (pending.length > 0) {
    const entry = pending.pop()!
    const { node, insideLeaf } = entry
    if (node.nodeName === '#text') {
      if (!insideLeaf && /[一-鿿]/.test((node as DefaultTreeAdapterTypes.TextNode).value)) {
        unwrappedCjkCount += 1
      }
      continue
    }

    let nextInsideLeaf = insideLeaf
    if ('tagName' in node) {
      const element = node as DefaultTreeAdapterTypes.Element
      if (!ALLOWED_TAGS.has(element.tagName)) invalidTags.add(element.tagName)
      const isLeaf =
        element.tagName === 'span' && element.attrs.some((attr) => attr.name === 'leaf')
      if (isLeaf) leafCount += 1
      nextInsideLeaf ||= isLeaf
      for (const attr of element.attrs) {
        if (attr.name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(attr.name)) {
          invalidAttributes.add(attr.name)
          continue
        }
        if (!isAllowedAttributeValue(element.tagName, attr.name, attr.value)) {
          invalidAttributeValues.add(`${element.tagName}[${attr.name}]`)
        }
      }
    }

    if ('childNodes' in node) {
      for (const child of node.childNodes) pending.push({ node: child, insideLeaf: nextInsideLeaf })
    }
  }
  if (invalidTags.size > 0) {
    issues.push({
      level: 'danger',
      text: `最终 HTML 含有不允许的标签：${[...invalidTags].join('、')}。`,
      type: 'htmlCompatibility',
    })
  }
  if (invalidAttributes.size > 0) {
    issues.push({
      level: 'danger',
      text: `最终 HTML 含有不允许的属性：${[...invalidAttributes].join('、')}。`,
      type: 'htmlCompatibility',
    })
  }
  if (invalidAttributeValues.size > 0) {
    issues.push({
      level: 'danger',
      text: `最终 HTML 含有不安全的属性值：${[...invalidAttributeValues].join('、')}。`,
      type: 'htmlCompatibility',
    })
  }

  return { issues, leafCount, unwrappedCjkCount }
}

function isAllowedAttributeValue(tagName: string, name: string, value: string): boolean {
  if (name === 'style') {
    // Generated styles do not need escapes/comments/at-rules. Reject them rather
    // than attempting to decode every CSS obfuscation a browser may understand.
    for (const character of value) {
      if (character.charCodeAt(0) < 32 && !'\t\n\r'.includes(character)) return false
    }
    if (/[\\@<>]|\/\*|\*\/|behavior\s*:|-moz-binding/i.test(value)) return false
    if (FORBIDDEN.some((rule) => rule.pattern.test(value))) return false
    return [...value.matchAll(/([a-z-]+)\s*\(/gi)].every((match) =>
      SAFE_CSS_FUNCTIONS.has(match[1]!.toLowerCase()),
    )
  }
  if (name === 'leaf') return tagName === 'span' && value === ''
  if (name === 'src') return tagName === 'img' && isSafeImageSource(value)
  if (name === 'alt') return tagName === 'img'
  if (name === 'colspan' || name === 'rowspan') {
    return (tagName === 'th' || tagName === 'td') && /^(?:[1-9]|[1-9]\d|100)$/.test(value)
  }
  return false
}

function isSafeImageSource(value: string): boolean {
  if (SAFE_IMAGE_DATA_URL.test(value)) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
