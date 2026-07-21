/**
 * MiMo 文本模型配置
 * 用于辅助排版的流式文本生成。
 */

export type ModelCapability = 'chat'

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
  /** 是否支持流式输出 */
  streamable: boolean
  /** 标签（用于 UI 分类） */
  tags: string[]
}

const BASE_URL = 'https://api.xiaomimimo.com/v1'

export const MIMO_MODELS: MimoModel[] = [
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

/** 按 ID 查找模型 */
export function getModelById(id: string): MimoModel | undefined {
  return MIMO_MODELS.find(m => m.id === id)
}

/** 默认文本生成模型 */
export const DEFAULT_CHAT_MODEL = 'mimo-v2.5'
