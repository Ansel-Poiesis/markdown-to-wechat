/**
 * Call n8n webhook to format markdown with AI.
 * Sends raw markdown, receives structured markdown with proper headings, bold, blockquotes, etc.
 */
export async function n8nFormatMarkdown(content: string): Promise<string> {
  const url = import.meta.env.VITE_N8N_FORMAT_WEBHOOK_URL as string | undefined
  if (!url) {
    throw new Error('未配置 n8n 排版服务地址 (VITE_N8N_FORMAT_WEBHOOK_URL)')
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`n8n 排版服务返回错误 (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()

  // n8n can return the result in different shapes depending on workflow design
  // Try common patterns: { formatted }, { output }, { result }, or plain string
  const result =
    data.formatted ?? data.output ?? data.result ?? data.markdown ?? data.text ?? data

  if (typeof result === 'string') {
    return result
  }

  // If n8n returns { data: { formatted: "..." } } etc.
  if (typeof data === 'object') {
    for (const val of Object.values(data)) {
      if (typeof val === 'string' && val.length > 10) return val
    }
  }

  throw new Error('n8n 返回格式无法识别，期望 { formatted: "..." }')
}
