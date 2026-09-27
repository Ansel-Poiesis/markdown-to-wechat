import { computed } from 'vue'
import type { MarkdownStats } from '@/types'
import { countReadableWords, inspectMarkdown, readableText } from '@/utils/markdownInspection'

export function useMarkdownAnalyzer(markdownRef: { value: string }) {
  const stats = computed<MarkdownStats>(() => {
    const inspection = inspectMarkdown(markdownRef.value || '')
    const markdown = inspection.prose
    const wordCount = countReadableWords(readableText(markdown))
    return {
      wordCount,
      readingMinutes: Math.max(1, Math.ceil(wordCount / 420)),
      headings: (markdown.match(/^#{1,4}\s+.+$/gm) || []).length,
      images: (markdown.match(/!\[[^[\]\r\n]*]\([^()[\]\r\n]+\)/g) || []).length,
      links: (markdown.match(/(?<!!)\[[^[\]\r\n]+]\((https?:\/\/[^()[\]\r\n]+)\)/gi) || []).length,
      codeBlocks: inspection.codeBlocks.length,
      tableRows: (markdown.match(/^\s*\|.+\|\s*$/gm) || []).length,
      paragraphs: markdown.split(/\n{2,}/).filter((item) => readableText(item)).length,
    }
  })
  return { stats }
}
