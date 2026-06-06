export interface LocalImageMatch {
  full: string
  alt: string
  path: string
  filename: string
}

export function findLocalImages(markdown: string): LocalImageMatch[] {
  const regex = /!\[([^\]]*)]\((?!https?:\/\/)([^)]+)\)/gi
  const results: LocalImageMatch[] = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const alt = match[1] ?? ''
    const path = match[2] ?? ''
    const filename = path.split(/[/\\]/).pop() || path
    results.push({ full: match[0], alt, path, filename })
  }
  return results
}

export function replaceLocalImages(markdown: string, prefix: string): { content: string; count: number } {
  let count = 0
  const replaced = markdown.replace(
    /!\[([^\]]*)]\((?!https?:\/\/)([^)]+)\)/gi,
    (_, alt, path) => {
      const filename = path.split(/[/\\]/).pop() || path
      const newUrl = prefix.replace(/\/$/, '') + '/' + filename
      count++
      return `![${alt}](${newUrl})`
    },
  )
  return { content: replaced, count }
}
