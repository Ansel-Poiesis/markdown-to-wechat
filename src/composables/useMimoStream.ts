/**
 * Direct MiMo API call with SSE streaming for fast markdown formatting.
 * Bypasses n8n overhead — response starts appearing in ~2-3s instead of ~40s.
 *
 * 支持通过 modelId 参数选择不同的 MiMo 模型。
 */

import { getModelById, DEFAULT_CHAT_MODEL, type MimoModel } from '@/config/models'

const SYSTEM_PROMPT = `你是一个 Markdown 排版专家。对用户提供的原始文本进行排版优化，只输出排版后的 Markdown，不要添加解释或前言。

## 核心原则
- **零删改**：不删除、不改写、不概括任何实质内容。只调整排版格式，不改动措辞。

## 标题层级
- 根据语义为段落添加合适的标题层级（# ## ###），不要只用一层标题
- 最多使用三级标题（###），不要嵌套过深
- 主题/大节用 ##，小节用 ###，全文大标题用 #（如有）

## 强调与加粗
- 关键概念、核心观点、重要人名/书名用 **加粗**
- 专业术语首次出现可用 *斜体* 或 **加粗**
- 不要滥用加粗，一段中加粗不超过2-3处

## 列表
- 并列的要点、步骤、枚举项转为无序列表（- 开头）
- 有明确顺序关系的步骤用有序列表（1. 2. 3.）
- 列表项保持简洁，每项1-2句

## 引用
- 原文引用、他人观点、对话内容用 > 引用块
- 引用块内可包含多段落，每段前加 >

## 中英文间距（重要）
- 中文与英文/数字之间必须加空格，如：使用 AI 工具、在 2024 年
- 中文与半角括号/引号之间不加空格
- 英文专有名词保持原样大小写

## 标点符号
- 中文正文使用全角标点：，。！？；：（）""''
- 数学表达式、代码、URL 中保持半角标点
- 省略号统一用……（六个点），不用...

## 代码
- 行内代码用反引号包裹
- 多行代码块用三个反引号，标注语言类型

## 段落
- 保持原文段落结构，不要合并或拆分段落（除非原文明显错误）
- 段落之间空一行

## 输出格式
- 只输出纯 Markdown 文本
- 不要添加"以下是排版后的文本"等前言
- 不要添加任何 HTML 标签`

interface StreamOptions {
  onChunk: (text: string) => void
  signal?: AbortSignal
  /** 模型 ID，默认使用 mimo-v2.5 */
  modelId?: string
}

/**
 * 获取 MiMo API 配置
 * 优先使用环境变量，回退到模型配置中的 endpoint
 */
function getApiConfig(model: MimoModel) {
  const envUrl = import.meta.env.VITE_MIMO_API_URL as string
  const apiKey = import.meta.env.VITE_MIMO_API_KEY as string

  if (!apiKey) {
    throw new Error('未配置 MiMo API Key (VITE_MIMO_API_KEY)')
  }

  // 环境变量中的 URL 仅用于 chat completions 端点
  const endpoint = model.capability === 'chat' && envUrl ? envUrl : model.endpoint

  return { endpoint, apiKey }
}

export async function mimoFormatStream(
  content: string,
  { onChunk, signal, modelId }: StreamOptions,
): Promise<string> {
  const id = modelId || DEFAULT_CHAT_MODEL
  const model = getModelById(id)

  if (!model) {
    throw new Error(`未知的 MiMo 模型: ${id}`)
  }

  if (model.capability !== 'chat') {
    throw new Error(`模型 ${model.name} 不支持文本生成（当前能力: ${model.capability}）`)
  }

  const { endpoint, apiKey } = getApiConfig(model)

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      max_completion_tokens: model.defaults?.max_completion_tokens ?? 4000,
      temperature: model.defaults?.temperature ?? 0.2,
      stream: true,
      reasoning_effort: model.defaults?.reasoning_effort ?? 'low',
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`MiMo API 错误 (${res.status}): ${errText.slice(0, 200)}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()! // keep incomplete line

    for (const line of lines) {
      const prev = full
      full = parseSSELine(line, full)
      if (full !== prev) onChunk(full)
    }
  }

  return full.trim()
}

function parseSSELine(line: string, acc: string): string {
  const trimmed = line.trim()
  if (!trimmed?.startsWith('data:')) return acc
  const payload = trimmed.slice(5).trim()
  if (payload === '[DONE]') return acc
  try {
    const chunk = JSON.parse(payload) as {
      choices?: { delta?: { content?: string } }[]
    }
    const token = chunk.choices?.[0]?.delta?.content
    return token ? acc + token : acc
  } catch {
    return acc
  }
}
