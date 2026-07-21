import type { ArticleDocument, ArticleHeading } from '@/types'

export function analyzeArticle(markdown: string): ArticleDocument {
  const headings: ArticleHeading[] = []
  let sectionIndex = 0
  let inCode = false

  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```')) {
      inCode = !inCode
      continue
    }
    if (inCode) continue

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
    hasCode: /```[\s\S]*?```/.test(markdown),
    hasImages: /!\[[^\]]*]\([^)]+\)/.test(markdown),
    hasTables: /^\s*\|.+\|\s*$/m.test(markdown),
  }
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_~=`]/g, '')
    .trim()
}
