export const FEEDBACK_EMAIL = 'callansel@agent.qq.com'

export type FeedbackCategory = 'problem' | 'suggestion' | 'experience' | 'other'

export interface FeedbackDiagnostics {
  appVersion: string
  runtime: string
  platform: string
  viewport: string
  theme: string
  articleStats: string
  warnings: string
  pageUrl: string
}

export interface FeedbackPayload {
  category: FeedbackCategory
  message: string
  contact?: string
  diagnostics?: FeedbackDiagnostics
  createdAt: string
}

export type FeedbackDelivery = 'endpoint' | 'email'

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  problem: '问题反馈',
  suggestion: '功能建议',
  experience: '体验意见',
  other: '其他反馈',
}

export function feedbackDeliveryMode(): FeedbackDelivery {
  return import.meta.env.VITE_FEEDBACK_ENDPOINT?.trim() ? 'endpoint' : 'email'
}

export function buildFeedbackMailto(payload: FeedbackPayload): string {
  const subject = `[微信 Markdown 排版][${CATEGORY_LABELS[payload.category]}] 用户反馈`
  const body = formatFeedbackBody(payload)
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function formatFeedbackBody(payload: FeedbackPayload): string {
  const lines = [
    `反馈类型：${CATEGORY_LABELS[payload.category]}`,
    '',
    '反馈内容：',
    payload.message.trim(),
    '',
    `联系方式：${payload.contact?.trim() || '未填写'}`,
  ]

  if (payload.diagnostics) {
    const diagnostics = payload.diagnostics
    lines.push(
      '',
      '--- 诊断信息 ---',
      `提交时间：${payload.createdAt}`,
      `应用版本：${diagnostics.appVersion}`,
      `运行环境：${diagnostics.runtime}`,
      `系统平台：${diagnostics.platform}`,
      `视口尺寸：${diagnostics.viewport}`,
      `当前主题：${diagnostics.theme}`,
      `稿件统计：${diagnostics.articleStats}`,
      `预检信息：${diagnostics.warnings}`,
      `页面地址：${diagnostics.pageUrl}`,
      '隐私说明：未附带文章正文、草稿内容或剪贴板数据。',
    )
  }

  return lines.join('\n')
}

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackDelivery> {
  const endpoint = resolveFeedbackEndpoint()
  if (endpoint) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12_000)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'markdown-to-wechat', ...payload }),
        credentials: 'omit',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`反馈服务暂时不可用（${response.status}）`)
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
  const configured = import.meta.env.VITE_FEEDBACK_ENDPOINT?.trim()
  if (!configured) return null

  const endpoint = new URL(configured, window.location.href)
  const localEndpoint = ['localhost', '127.0.0.1', '::1'].includes(endpoint.hostname)
  if (endpoint.protocol !== 'https:' && !localEndpoint) {
    throw new Error('反馈服务必须使用 HTTPS')
  }
  return endpoint.toString()
}
