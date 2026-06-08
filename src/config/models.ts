/**
 * MiMo 模型配置
 * 定义所有可用的 MiMo 模型及其能力、API 端点和参数
 */

export type ModelCapability = 'chat' | 'asr' | 'tts' | 'voiceclone' | 'voicedesign'

export interface MimoModel {
  id: string
  name: string
  description: string
  capability: ModelCapability
  endpoint: string
  /** 默认参数（chat 模型） */
  defaults?: {
    max_completion_tokens?: number
    temperature?: number
    reasoning_effort?: string
  }
  /** TTS 特有参数 */
  ttsDefaults?: {
    voice?: string
    speed?: number
    format?: 'mp3' | 'wav' | 'pcm'
  }
  /** 是否支持流式输出 */
  streamable: boolean
  /** 标签（用于 UI 分类） */
  tags: string[]
}

const BASE_URL = import.meta.env.VITE_MIMO_API_URL?.replace('/chat/completions', '') || 'https://api.xiaomimimo.com/v1'

export const MIMO_MODELS: MimoModel[] = [
  // ── 文本生成模型 ──────────────────────────────────────────
  {
    id: 'mimo-v2.5-pro',
    name: 'MiMo v2.5 Pro',
    description: '最强文本模型，深度推理与高质量输出',
    capability: 'chat',
    endpoint: `${BASE_URL}/chat/completions`,
    defaults: {
      max_completion_tokens: 8000,
      temperature: 0.2,
      reasoning_effort: 'high',
    },
    streamable: true,
    tags: ['文本', '推荐'],
  },
  {
    id: 'mimo-v2.5',
    name: 'MiMo v2.5',
    description: '标准文本模型，快速响应',
    capability: 'chat',
    endpoint: `${BASE_URL}/chat/completions`,
    defaults: {
      max_completion_tokens: 4000,
      temperature: 0.2,
      reasoning_effort: 'low',
    },
    streamable: true,
    tags: ['文本', '快速'],
  },

  // ── 语音识别模型 ──────────────────────────────────────────
  {
    id: 'mimo-v2.5-asr',
    name: 'MiMo v2.5 ASR',
    description: '语音转文字，支持多语言识别',
    capability: 'asr',
    endpoint: `${BASE_URL}/audio/transcriptions`,
    streamable: false,
    tags: ['语音', '识别'],
  },

  // ── 语音合成模型 ──────────────────────────────────────────
  {
    id: 'mimo-v2.5-tts',
    name: 'MiMo v2.5 TTS',
    description: '基础语音合成，多种音色可选',
    capability: 'tts',
    endpoint: `${BASE_URL}/audio/speech`,
    ttsDefaults: {
      voice: 'alloy',
      speed: 1.0,
      format: 'mp3',
    },
    streamable: false,
    tags: ['语音', '合成'],
  },
  {
    id: 'mimo-v2.5-tts-voiceclone',
    name: 'MiMo v2.5 声音克隆',
    description: '克隆指定音色进行语音合成',
    capability: 'voiceclone',
    endpoint: `${BASE_URL}/audio/speech`,
    ttsDefaults: {
      speed: 1.0,
      format: 'mp3',
    },
    streamable: false,
    tags: ['语音', '克隆'],
  },
  {
    id: 'mimo-v2.5-tts-voicedesign',
    name: 'MiMo v2.5 声音设计',
    description: '自定义设计语音音色与风格',
    capability: 'voicedesign',
    endpoint: `${BASE_URL}/audio/speech`,
    ttsDefaults: {
      speed: 1.0,
      format: 'mp3',
    },
    streamable: false,
    tags: ['语音', '设计'],
  },
]

// ── 便捷查询 ────────────────────────────────────────────────

/** 按能力筛选模型 */
export function getModelsByCapability(capability: ModelCapability): MimoModel[] {
  return MIMO_MODELS.filter(m => m.capability === capability)
}

/** 获取所有文本生成模型（用于排版功能） */
export function getChatModels(): MimoModel[] {
  return getModelsByCapability('chat')
}

/** 获取所有 TTS 相关模型 */
export function getTTSModels(): MimoModel[] {
  return MIMO_MODELS.filter(m => ['tts', 'voiceclone', 'voicedesign'].includes(m.capability))
}

/** 按 ID 查找模型 */
export function getModelById(id: string): MimoModel | undefined {
  return MIMO_MODELS.find(m => m.id === id)
}

/** 默认文本生成模型 */
export const DEFAULT_CHAT_MODEL = 'mimo-v2.5'
