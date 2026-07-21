import type { WarningItem } from '@/types'

const FORBIDDEN: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /<style[\s>]/i, message: '最终 HTML 含有 style 标签，公众号会过滤。' },
  { pattern: /<script[\s>]/i, message: '最终 HTML 含有 script 标签，公众号会过滤。' },
  { pattern: /<\/?div[\s>]/i, message: '最终 HTML 含有 div，请改用 section。' },
  { pattern: /\sclass\s*=/i, message: '最终 HTML 含有 class，复制后样式可能丢失。' },
  { pattern: /\sid\s*=/i, message: '最终 HTML 含有 id，公众号会剥离。' },
  { pattern: /position\s*:\s*(fixed|absolute|sticky)/i, message: '最终 HTML 使用了公众号不支持的定位。' },
  { pattern: /float\s*:/i, message: '最终 HTML 使用了公众号不支持的 float。' },
  { pattern: /display\s*:\s*grid/i, message: '最终 HTML 使用了 display:grid。' },
  { pattern: /var\s*\(\s*--/i, message: '最终 HTML 使用了 CSS 变量。' },
  { pattern: /@(media|keyframes|import)/i, message: '最终 HTML 使用了公众号会过滤的 CSS 规则。' },
  { pattern: /url\s*\(\s*['"]?https?:\/\/[^)]*\.(woff2?|ttf|otf|eot)/i, message: '最终 HTML 引用了外部字体。' },
  { pattern: /white-space\s*:\s*pre/i, message: '代码块使用 white-space:pre，微信中可能出现异常空白。' },
]

export interface WechatHtmlValidation {
  valid: boolean
  issues: WarningItem[]
  leafCount: number
}

export function leafifyHtml(html: string): string {
  const tokens = html.split(/(<[^>]+>)/g)
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
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(html)) issues.push({ level: 'danger', text: rule.message, type: 'htmlCompatibility' })
  }
  const leafCount = (html.match(/<span\s+leaf(?:="")?/gi) || []).length
  if (/[一-鿿]/.test(html) && leafCount === 0) {
    issues.push({ level: 'danger', text: '最终 HTML 没有 span leaf 包裹，粘贴后样式可能大面积丢失。', type: 'htmlCompatibility' })
  }
  const unwrappedCount = countUnwrappedCjk(html)
  if (unwrappedCount > 0) {
    issues.push({
      level: 'danger',
      text: `最终 HTML 有 ${unwrappedCount} 处中文文字未使用 span leaf 包裹。`,
      type: 'htmlCompatibility',
    })
  }
  return { valid: !issues.some((issue) => issue.level === 'danger'), issues, leafCount }
}

function countUnwrappedCjk(html: string): number {
  const tokens = html.split(/(<[^>]+>)/g)
  const stack: Array<{ tag: string; leaf: boolean }> = []
  let leafDepth = 0
  let count = 0

  for (const token of tokens) {
    if (!token) continue
    if (!token.startsWith('<')) {
      if (leafDepth === 0 && /[一-鿿]/.test(token)) count += 1
      continue
    }
    if (token.startsWith('</')) {
      const tagName = token.match(/^<\/\s*([a-z0-9]+)/i)?.[1]?.toLowerCase()
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index]?.tag !== tagName) continue
        const removed = stack.splice(index)
        leafDepth -= removed.filter((entry) => entry.leaf).length
        break
      }
      continue
    }
    if (/^<!|^<\?|\/>$/.test(token)) continue
    const tagName = token.match(/^<\s*([a-z0-9]+)/i)?.[1]?.toLowerCase()
    if (!tagName || ['img', 'br', 'hr', 'meta', 'link', 'input'].includes(tagName)) continue
    const leaf = tagName === 'span' && /\sleaf(?:\s*=|[\s>])/.test(token)
    stack.push({ tag: tagName, leaf })
    if (leaf) leafDepth += 1
  }
  return count
}
