import {
  CATEGORY_LABELS,
  formatFeedbackBody,
  type FeedbackPayload,
} from './feedback-protocol'

export const FEEDBACK_EMAIL = 'callansel@agent.qq.com'

export {
  createFeedbackId,
  formatFeedbackBody,
  type FeedbackCategory,
  type FeedbackDiagnostics,
  type FeedbackPayload,
} from './feedback-protocol'

export type FeedbackDelivery = 'endpoint' | 'email'

export function feedbackDeliveryMode(): FeedbackDelivery {
  return resolveFeedbackEndpoint() ? 'endpoint' : 'email'
}

export function buildFeedbackMailto(payload: FeedbackPayload): string {
  const subject = `[微信 Markdown 排版][${payload.feedbackId}][${CATEGORY_LABELS[payload.category]}]`
  const body = formatFeedbackBody(payload)
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildFeedbackFormData(payload: FeedbackPayload): FormData {
  const data = new FormData()
  data.set('来源', '微信 Markdown 排版')
  data.set('反馈编号', payload.feedbackId)
  data.set('反馈类型', CATEGORY_LABELS[payload.category])
  data.set('提交时间', payload.createdAt)
  data.set('反馈详情', formatFeedbackBody(payload))
  data.set('_subject', `[微信 Markdown 排版][${payload.feedbackId}][${CATEGORY_LABELS[payload.category]}]`)
  data.set('_template', 'table')
  data.set('_captcha', 'false')
  data.set('_honey', '')
  return data
}

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackDelivery> {
  const endpoint = resolveFeedbackEndpoint()
  if (endpoint) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12_000)
    try {
      const formSubmit = new URL(endpoint).hostname === 'formsubmit.co'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: formSubmit ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
        body: formSubmit
          ? buildFeedbackFormData(payload)
          : JSON.stringify({ product: 'markdown-to-wechat', ...payload }),
        credentials: 'omit',
        signal: controller.signal,
      })
      const result = (await response.json().catch(() => null)) as {
        accepted?: boolean
        error?: string
        message?: string
        success?: boolean | string
      } | null
      if (!response.ok) {
        throw new Error(result?.error || `反馈服务暂时不可用（${response.status}）`)
      }
      if (formSubmit && String(result?.success) !== 'true') {
        throw new Error(result?.message || '反馈服务暂时不可用')
      }
      return 'endpoint'
    } finally {
      window.clearTimeout(timeout)
    }
  }

  const mailto = buildFeedbackMailto(payload)
  if (window.electronAPI?.openFeedbackEmail) {
    await window.electronAPI.openFeedbackEmail(mailto)
  } else {
    window.location.assign(mailto)
  }
  return 'email'
}

function resolveFeedbackEndpoint(): string | null {
  if (window.electronAPI?.openFeedbackEmail) return null
  const configured = import.meta.env.VITE_FEEDBACK_ENDPOINT?.trim()
  if (!configured) return null

  const endpoint = new URL(configured, window.location.href)
  const localEndpoint = ['localhost', '127.0.0.1', '::1'].includes(endpoint.hostname)
  if (endpoint.protocol !== 'https:' && !localEndpoint) {
    throw new Error('反馈服务必须使用 HTTPS')
  }
  return endpoint.toString()
}
