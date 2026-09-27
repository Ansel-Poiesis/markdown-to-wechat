import type { ArticleDocument, ArticleHeading } from '@/types'

export interface CodeFence {
  marker: string
  length: number
  language: string
}

export function openingCodeFence(line: string): CodeFence | undefined {
  const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
  if (!match || (match[1]!.startsWith('`') && match[2]!.includes('`'))) return undefined
  return {
    marker: match[1]![0]!,
    length: match[1]!.length,
    language: match[2]!.trim().split(/\s+/)[0] || '',
  }
}

export function closingCodeFence(line: string, fence: CodeFence): boolean {
  const match = /^ {0,3}(`+|~+)\s*$/.exec(line)
  return !!match && match[1]![0] === fence.marker && match[1]!.length >= fence.length
}

export function analyzeArticle(markdown: string): ArticleDocument {
  const headings: ArticleHeading[] = []
  let sectionIndex = 0
  let fence: CodeFence | undefined
  let hasCode = false
  let inDirective = false

  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (fence) {
      if (closingCodeFence(raw, fence)) fence = undefined
      continue
    }
    if (inDirective) {
      if (line === ':::') inDirective = false
      continue
    }
    fence = openingCodeFence(raw)
    if (fence) {
      hasCode = true
      continue
    }
    if (/^:::\s*(lead|note|signature)(?:\s+.+)?$/.test(line)) {
      inDirective = true
      continue
    }

    const match = /^(#{1,4})\s+(.+)$/.exec(line)
    if (!match) continue
    const level = match[1]?.length || 1
    if (level === 2) sectionIndex += 1
    headings.push({
      level,
      text: stripInlineMarkdown(match[2] || ''),
      sectionIndex: level === 2 ? sectionIndex : undefined,
    })
  }

  const title = headings.find((heading) => heading.level === 1)?.text || '未命名文章'
  return {
    title,
    headings,
    sectionCount: sectionIndex,
    hasCode,
    hasImages: /!\[[^\]]*]\([^)]+\)/.test(markdown),
    hasTables: /^\s*\|.+\|\s*$/m.test(markdown),
  }
}

export function stripInlineMarkdown(value: string): string {
  const pairs = new Map<number, number>()
  const brackets: number[] = []
  const parentheses: number[] = []
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\\') {
      i += 1
      continue
    }
    if (value[i] === '[') brackets.push(i)
    if (value[i] === ']' && brackets.length) pairs.set(brackets.pop()!, i)
    if (value[i] === '(') parentheses.push(i)
    if (value[i] === ')' && parentheses.length) pairs.set(parentheses.pop()!, i)
  }
  const parts: string[] = []
  let start = 0
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '\\') {
      i += 1
      continue
    }
    const bracket = value[i] === '!' && value[i + 1] === '[' ? i + 1 : i
    if (value[bracket] !== '[') continue
    const labelEnd = pairs.get(bracket)
    if (labelEnd === undefined || value[labelEnd + 1] !== '(') continue
    const targetEnd = pairs.get(labelEnd + 1)
    if (targetEnd === undefined) continue
    parts.push(value.slice(start, i), value.slice(bracket + 1, labelEnd))
    i = targetEnd
    start = i + 1
  }
  parts.push(value.slice(start))
  return parts
    .join('')
    .replace(/[*_~=`]/g, '')
    .trim()
}
