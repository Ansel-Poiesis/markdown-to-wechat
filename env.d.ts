/// <reference types="vite/client" />

interface MimoFormatRequest {
  requestId: string
  content: string
  model: string
  endpoint: string
  systemPrompt: string
  maxCompletionTokens: number
  temperature: number
  reasoningEffort: string
}

interface Window {
  electronAPI?: {
    platform: string
    getMimoStatus: () => Promise<{ configured: boolean }>
    formatMimo: (request: MimoFormatRequest, onChunk: (text: string) => void) => Promise<string>
    cancelMimo: (requestId: string) => void
    openFeedbackEmail: (mailto: string) => Promise<void>
  }
}
