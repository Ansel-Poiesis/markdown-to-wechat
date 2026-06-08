/**
 * MiMo 聊天 composable — 支持所有模型类型的交互
 */

import { ref, computed } from 'vue'
import { MIMO_MODELS, getModelById, type MimoModel, type ModelCapability } from '@/config/models'
import { mimoTTS, mimoASR } from '@/composables/useMimoVoice'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'audio'
  content: string
  /** TTS 生成的音频 URL */
  audioUrl?: string
  /** ASR 转写结果 */
  transcript?: string
  timestamp: number
  modelId?: string
}

export function useMimoChat() {
  const messages = ref<ChatMessage[]>([])
  const selectedModelId = ref('mimo-v2.5')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let abortCtrl: AbortController | null = null

  const selectedModel = computed(() => getModelById(selectedModelId.value))
  const selectedCapability = computed<ModelCapability>(() => selectedModel.value?.capability ?? 'chat')

  // ── 发送消息 ──────────────────────────────────────────────

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading.value) return
    error.value = null

    const model = selectedModel.value
    if (!model) {
      error.value = '请选择模型'
      return
    }

    // 用户消息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      modelId: model.id,
    }
    messages.value.push(userMsg)

    isLoading.value = true
    abortCtrl = new AbortController()

    try {
      if (model.capability === 'chat') {
        await streamChat(text, model)
      } else if (['tts', 'voiceclone', 'voicedesign'].includes(model.capability)) {
        await doTTS(text, model)
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // 用户取消
      } else {
        error.value = e instanceof Error ? e.message : '请求失败'
      }
    } finally {
      isLoading.value = false
      abortCtrl = null
    }
  }

  // ── Chat 流式对话 ─────────────────────────────────────────

  async function streamChat(text: string, model: MimoModel) {
    const apiKey = import.meta.env.VITE_MIMO_API_KEY as string
    const envUrl = import.meta.env.VITE_MIMO_API_URL as string
    const endpoint = envUrl || model.endpoint

    // 构建历史消息（最近 10 条）
    const history = messages.value
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: model.id,
    }
    messages.value.push(assistantMsg)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: '你是一个有用的 AI 助手。用简洁清晰的中文回答。' },
          ...history,
        ],
        max_completion_tokens: model.defaults?.max_completion_tokens ?? 4000,
        temperature: model.defaults?.temperature ?? 0.7,
        stream: true,
        reasoning_effort: model.defaults?.reasoning_effort ?? 'low',
      }),
      signal: abortCtrl?.signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`API 错误 (${res.status}): ${errText.slice(0, 200)}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('无法读取流式响应')
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed?.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const chunk = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[]
          }
          const token = chunk.choices?.[0]?.delta?.content
          if (token) assistantMsg.content += token
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  // ── TTS 语音合成 ──────────────────────────────────────────

  async function doTTS(text: string, model: MimoModel) {
    const blob = await mimoTTS({ text, modelId: model.id })
    const url = URL.createObjectURL(blob)

    const audioMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'audio',
      content: text,
      audioUrl: url,
      timestamp: Date.now(),
      modelId: model.id,
    }
    messages.value.push(audioMsg)

    // 自动播放
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play().catch(() => {
      // 浏览器可能阻止自动播放
    })
  }

  // ── ASR 语音识别 ──────────────────────────────────────────

  async function transcribeAudio(audioBlob: Blob) {
    isLoading.value = true
    error.value = null
    try {
      const text = await mimoASR({ audio: audioBlob, modelId: 'mimo-v2.5-asr' })
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🎤 语音识别结果：\n\n${text}`,
        timestamp: Date.now(),
        modelId: 'mimo-v2.5-asr',
      }
      messages.value.push(msg)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : '语音识别失败'
    } finally {
      isLoading.value = false
    }
  }

  // ── 控制 ──────────────────────────────────────────────────

  function cancel() {
    abortCtrl?.abort()
    isLoading.value = false
  }

  function clearMessages() {
    messages.value = []
    error.value = null
  }

  function removeMessage(id: string) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return {
    messages,
    selectedModelId,
    selectedModel,
    selectedCapability,
    isLoading,
    error,
    allModels: MIMO_MODELS,
    sendMessage,
    transcribeAudio,
    cancel,
    clearMessages,
    removeMessage,
  }
}
