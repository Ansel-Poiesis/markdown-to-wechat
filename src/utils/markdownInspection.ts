import { closingCodeFence, openingCodeFence, type CodeFence } from '@/utils/articleStructure'

/** Share the renderer's fence rules so examples cannot trigger document-level warnings. */
export function inspectMarkdown(markdown: string) {
  const prose: string[] = []
  const codeBlocks: string[] = []
  let fence: CodeFence | undefined
  let block: string[] = []
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    if (fence) {
      block.push(line)
      prose.push('')
      if (closingCodeFence(line, fence)) {
        codeBlocks.push(block.join('\n'))
        fence = undefined
        block = []
      }
    } else {
      fence = openingCodeFence(line)
      if (fence) {
        block = [line]
        prose.push('')
      } else {
        prose.push(line)
      }
    }
  }
  if (fence) codeBlocks.push(block.join('\n'))
  return { prose: prose.join('\n'), codeBlocks, unclosedCode: Boolean(fence) }
}

export function readableText(markdown: string): string {
  return markdown
    .replace(/!\[[^[\]\r\n]*]\([^()[\]\r\n]+\)/g, ' ')
    .replace(/\[([^[\]\r\n]+)]\([^()[\]\r\n]+\)/g, '$1')
    .replace(/[#>*_`~\-|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function countReadableWords(text: string): number {
  const chinese = text.match(/[一-鿿]/g) || []
  const latin = text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []
  return chinese.length + latin.length
}
