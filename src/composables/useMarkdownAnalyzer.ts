import { computed } from 'vue'
import type { MarkdownStats } from '@/types'

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~\-|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countReadableWords(text: string): number {
  const chinese = text.match(/[一-鿿]/g) || []
  const latin = text
    .replace(/[一-鿿]/g, ' ')
    .match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []
  return chinese.length + latin.length
}

export function useMarkdownAnalyzer(markdownRef: { value: string }) {
  const stats = computed<MarkdownStats>(() => {
    const markdown = markdownRef.value || ''
    const text = stripMarkdown(markdown)
    const wordCount = countReadableWords(text)
    const headings = markdown.match(/^#{1,4}\s+.+$/gm) || []
    const images = markdown.match(/!\[[^\]]*]\([^)]+\)/g) || []
    const links = markdown.match(/(?<!!)\[[^\]]+]\((https?:\/\/[^)]+)\)/gi) || []
    const codeBlocks = markdown.match(/```[\s\S]*?```/g) || []
    const tableRows = markdown.match(/^\s*\|.+\|\s*$/gm) || []
    return {
      wordCount,
      readingMinutes: Math.max(1, Math.ceil(wordCount / 420)),
      headings: headings.length,
      images: images.length,
      links: links.length,
      codeBlocks: codeBlocks.length,
      tableRows: tableRows.length,
      paragraphs: markdown.split(/\n{2,}/).filter((item) => stripMarkdown(item)).length,
    }
  })

  return { stats }
}
