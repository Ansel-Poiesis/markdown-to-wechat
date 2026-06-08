/**
 * MiMo 语音功能：TTS（语音合成）、ASR（语音识别）、声音克隆、声音设计
 */

import { getModelById, getTTSModels, type ModelCapability } from '@/config/models'

const apiKey = import.meta.env.VITE_MIMO_API_KEY as string

// ── 类型定义 ────────────────────────────────────────────────

export interface TTSOptions {
  text: string
  modelId?: string
  voice?: string
  speed?: number
  format?: 'mp3' | 'wav' | 'pcm'
  /** 声音克隆：参考音频文件（File 或 Blob） */
  referenceAudio?: Blob
  /** 声音设计：音色描述文本 */
  voiceDescription?: string
}

export interface ASROptions {
  /** 音频文件（File 或 Blob） */
  audio: Blob
  modelId?: string
  language?: string
  responseFormat?: 'json' | 'text' | 'verbose_json'
}

// ── TTS 语音合成 ────────────────────────────────────────────

/**
 * 文本转语音
 * 返回音频 Blob，可直接用于 Audio 播放或下载
 */
export async function mimoTTS(options: TTSOptions): Promise<Blob> {
  const {
    text,
    modelId = 'mimo-v2.5-tts',
    voice = 'alloy',
    speed = 1,
    format = 'mp3',
    referenceAudio,
    voiceDescription,
  } = options

  if (!apiKey) throw new Error('未配置 MiMo API Key')

  const model = getModelById(modelId)
  if (!model) throw new Error(`未知模型: ${modelId}`)

  const ttsCapable: ModelCapability[] = ['tts', 'voiceclone', 'voicedesign']
  if (!ttsCapable.includes(model.capability)) {
    throw new Error(`模型 ${model.name} 不支持语音合成`)
  }

  const formData = new FormData()
  formData.append('model', model.id)
  formData.append('input', text)
  formData.append('voice', voice)
  formData.append('speed', String(speed))
  formData.append('response_format', format)

  // 声音克隆：附加参考音频
  if (model.capability === 'voiceclone' && referenceAudio) {
    formData.append('reference_audio', referenceAudio, 'reference.wav')
  }

  // 声音设计：附加音色描述
  if (model.capability === 'voicedesign' && voiceDescription) {
    formData.append('voice_description', voiceDescription)
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'api-key': apiKey },
    body: formData,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`TTS 错误 (${res.status}): ${errText.slice(0, 200)}`)
  }

  return res.blob()
}

/**
 * 播放 TTS 音频（便捷方法）
 */
export async function mimoTTSPlay(options: TTSOptions): Promise<HTMLAudioElement> {
  const blob = await mimoTTS(options)
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.onended = () => URL.revokeObjectURL(url)
  await audio.play()
  return audio
}

// ── ASR 语音识别 ────────────────────────────────────────────

/**
 * 语音转文字
 * 返回识别出的文本
 */
export async function mimoASR(options: ASROptions): Promise<string> {
  const { audio, modelId = 'mimo-v2.5-asr', language = 'zh', responseFormat = 'json' } = options

  if (!apiKey) throw new Error('未配置 MiMo API Key')

  const model = getModelById(modelId)
  if (model?.capability !== 'asr') {
    throw new Error(`ASR 错误: 模型不支持语音识别`)
  }

  const formData = new FormData()
  formData.append('model', model.id)
  formData.append('file', audio, 'audio.wav')
  formData.append('language', language)
  formData.append('response_format', responseFormat)

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: { 'api-key': apiKey },
    body: formData,
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`ASR 错误 (${res.status}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.text ?? data
}

// ── 工具函数 ────────────────────────────────────────────────

/** 获取所有可用的 TTS 模型（用于 UI 下拉） */
export function getAvailableTTSModels() {
  return getTTSModels().map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    capability: m.capability,
  }))
}
