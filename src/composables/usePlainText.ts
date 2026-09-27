/** Remove presentation markup while preserving the text inside code fences and spans. */
export function markdownToPlainText(input: string): string {
  const lines = input.split(/\r?\n/)
  const output: string[] = []
  let fence: { marker: string; length: number } | null = null
  for (const line of lines) {
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)?.[1]
      if (closing?.[0] === fence.marker && closing.length >= fence.length) fence = null
      else output.push(line)
      continue
    }
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (opening?.[1] && (opening[1][0] !== '`' || !opening[2]?.includes('`'))) {
      fence = { marker: opening[1][0]!, length: opening[1].length }
      continue
    }
    const text = line
      .replace(/^ {0,3}#{1,6}[ \t]+/, '')
      .replace(/^\s*(?:>[ \t]*)+/, '')
      .replace(/^\s*[-*+][ \t]+\[[ xX]\][ \t]*/, '')
      .replace(/^\s*[-*+][ \t]+/, '')
      .replace(/^\s*\d+[.)][ \t]+/, '')
      .replace(/^ {0,3}(?:-{3,}|\*{3,}|_{3,})[ \t]*$/, '')
    output.push(stripInlineExceptCode(text))
  }
  return output.join('\n')
}

function stripInline(value: string): string {
  return value
    .replace(/!?\[([^[\]\r\n]*)\]\([^()[\]\r\n]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/==(.+?)==/g, '$1')
}

function stripInlineExceptCode(value: string): string {
  let output = ''
  let cursor = 0
  const spans = /(`+)([^\n]*?)\1(?!`)/g
  for (const span of value.matchAll(spans)) {
    output += stripInline(value.slice(cursor, span.index)) + span[2]
    cursor = span.index + span[0].length
  }
  return output + stripInline(value.slice(cursor))
}
