/**
 * MiMo formatting with bounded SSE streaming and transactional completion.
 *
 * 支持通过 modelId 参数选择不同的 MiMo 模型。
 */

import { getModelById, DEFAULT_CHAT_MODEL, type MimoModel } from '@/config/models'

const REQUEST_TIMEOUT_MS = 120_000
const MAX_CONTENT_LENGTH = 500_000
const MAX_OUTPUT_LENGTH = 1_000_000
const MAX_STREAM_BYTES = 8_000_000
const MAX_EVENT_LENGTH = 256_000

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

export interface StreamOptions {
  onChunk: (text: string) => void
  signal?: AbortSignal
  /** 模型 ID，默认使用 mimo-v2.5 */
  modelId?: string
  /** Optional session credential; otherwise Electron uses its main-process key. */
  apiKey?: string
}

/**
 * Resolve an explicitly supplied session key against the configured model endpoint.
 */
function getBrowserApiConfig(model: MimoModel, apiKey = '') {
  if (!apiKey.trim()) {
    throw new Error('请先输入 MiMo API Key')
  }
  return { endpoint: model.endpoint, apiKey: apiKey.trim() }
}

export async function mimoFormatStream(content: string, options: StreamOptions): Promise<string> {
  const { onChunk, signal, modelId, apiKey } = options
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  if (content.length > MAX_CONTENT_LENGTH) throw new Error('正文过长，暂不发送')
  const id = modelId || DEFAULT_CHAT_MODEL
  const model = getModelById(id)

  if (!model) {
    throw new Error(`未知的 MiMo 模型: ${id}`)
  }

  if (model.capability !== 'chat') {
    throw new Error(`模型 ${model.name} 不支持文本生成（当前能力: ${model.capability}）`)
  }

  const electronApi = typeof window !== 'undefined' ? window.electronAPI : undefined
  if (electronApi?.formatMimo && !apiKey?.trim()) {
    const requestId = crypto.randomUUID()
    const cancel = () => electronApi.cancelMimo(requestId)
    signal?.addEventListener('abort', cancel, { once: true })
    try {
      const result = await electronApi.formatMimo(
        {
          requestId,
          content,
          model: model.id,
          endpoint: model.endpoint,
          systemPrompt: SYSTEM_PROMPT,
          maxCompletionTokens: model.defaults?.max_completion_tokens ?? 4000,
          temperature: model.defaults?.temperature ?? 0.2,
          reasoningEffort: model.defaults?.reasoning_effort ?? 'low',
        },
        onChunk,
      )
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      return result
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      throw error
    } finally {
      signal?.removeEventListener('abort', cancel)
    }
  }

  const browserConfig = getBrowserApiConfig(model, apiKey)
  const { endpoint } = browserConfig
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    const res = await abortable(
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': browserConfig.apiKey,
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
        signal: controller.signal,
        redirect: 'error',
        credentials: 'omit',
      }),
      controller.signal,
    )

    if (!res.ok) {
      void res.body?.cancel().catch(() => undefined)
      throw new Error(`MiMo API 错误 (${res.status})`)
    }

    reader = res.body?.getReader()
    if (!reader) throw new Error('无法读取流式响应')
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''
    let completed = false
    let streamBytes = 0

    const consume = (line: string) => {
      if (line.length > MAX_EVENT_LENGTH) throw new Error('辅助排版响应单条数据过长')
      const event = parseSSEEvent(line)
      if (event.finishReason && event.finishReason !== 'stop') {
        throw new Error(
          event.finishReason === 'length'
            ? '辅助排版输出被模型截断，原文未被替换'
            : '辅助排版响应被服务中止，原文未被替换',
        )
      }
      if (event.token) {
        full += event.token
        if (full.length > MAX_OUTPUT_LENGTH) throw new Error('辅助排版输出过长，原文未被替换')
        onChunk(full)
      }
      if (event.done) completed = true
    }

    while (!completed) {
      const { done, value } = await abortable(reader.read(), controller.signal)
      if (done) {
        buffer += decoder.decode()
        break
      }
      streamBytes += value.byteLength
      if (streamBytes > MAX_STREAM_BYTES) throw new Error('辅助排版响应过大，原文未被替换')

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()! // keep incomplete line

      for (const line of lines) {
        consume(line)
        if (completed) break
      }
      if (!completed && buffer.length > MAX_EVENT_LENGTH)
        throw new Error('辅助排版响应单条数据过长')
    }

    if (!completed && buffer.trim()) consume(buffer)

    if (!completed) {
      throw new Error('辅助排版响应未完整结束，原文未被替换')
    }
    if (!full.trim()) throw new Error('辅助排版没有返回有效内容')
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

    return full.trim()
  } catch (error) {
    if (timedOut) throw new Error('辅助排版服务超时，原文未被替换')
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
    // Do not wait for a peer that never closes its response body.
    void reader?.cancel().catch(() => undefined)
    controller.abort()
  }
}

function abortable<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'))
    task.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort))
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

export function parseSSELine(line: string, acc: string): string {
  const event = parseSSEEvent(line)
  return event.token ? acc + event.token : acc
}

export function parseSSEEvent(line: string): {
  token: string
  done: boolean
  finishReason?: string
} {
  const trimmed = line.trim()
  if (!trimmed?.startsWith('data:')) return { token: '', done: false }
  const payload = trimmed.slice(5).trim()
  if (payload === '[DONE]') return { token: '', done: true }
  let chunk: {
    error?: unknown
    choices?: { delta?: { content?: unknown }; finish_reason?: unknown }[]
  }
  try {
    chunk = JSON.parse(payload)
  } catch {
    throw new Error('辅助排版流数据损坏，原文未被替换')
  }
  if (!chunk || typeof chunk !== 'object' || chunk.error || !Array.isArray(chunk.choices)) {
    throw new Error('辅助排版响应格式无效，原文未被替换')
  }
  const choice = chunk.choices?.[0]
  const token = choice?.delta?.content
  const reason = choice?.finish_reason
  if (
    (token != null && typeof token !== 'string') ||
    (reason != null && typeof reason !== 'string')
  ) {
    throw new Error('辅助排版响应格式无效，原文未被替换')
  }
  return {
    token: typeof token === 'string' ? token : '',
    done: reason === 'stop',
    finishReason: typeof reason === 'string' ? reason : undefined,
  }
}
