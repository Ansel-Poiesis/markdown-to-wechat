export const FEEDBACK_PRODUCT = 'markdown-to-wechat'
export const FEEDBACK_SCHEMA = 'TASTELAB_FEEDBACK_V1'

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
  feedbackId: string
  category: FeedbackCategory
  message: string
  contact?: string
  diagnostics?: FeedbackDiagnostics
  createdAt: string
}

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  problem: '问题反馈',
  suggestion: '功能建议',
  experience: '体验意见',
  other: '其他反馈',
}

export function createFeedbackId(now = new Date(), randomValue = Math.random()): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '')
  const sequence = Math.floor(randomValue * 36 ** 6)
    .toString(36)
    .padStart(6, '0')
    .toUpperCase()
  return `FB-${date}-${sequence}`
}

export function formatFeedbackBody(payload: FeedbackPayload): string {
  const lines = [
    `反馈编号：${payload.feedbackId}`,
    `反馈类型：${CATEGORY_LABELS[payload.category]}`,
    `提交时间：${payload.createdAt}`,
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

export function formatMachineFeedbackBlock(payload: FeedbackPayload): string {
  const data = JSON.stringify({
    schemaVersion: 1,
    product: FEEDBACK_PRODUCT,
    ...payload,
  })
  return [`--- ${FEEDBACK_SCHEMA} ---`, data, `--- END_${FEEDBACK_SCHEMA} ---`].join('\n')
}

export function extractMachineFeedbackPayload(content: string): FeedbackPayload | null {
  const startMarker = `--- ${FEEDBACK_SCHEMA} ---`
  const endMarker = `--- END_${FEEDBACK_SCHEMA} ---`
  const start = content.indexOf(startMarker)
  const end = content.indexOf(endMarker, start + startMarker.length)
  if (start < 0 || end < 0) return null

  const raw = content.slice(start + startMarker.length, end).trim()
  try {
    const parsed = JSON.parse(raw) as Partial<FeedbackPayload> & {
      schemaVersion?: number
      product?: string
    }
    if (
      parsed.schemaVersion !== 1 ||
      parsed.product !== FEEDBACK_PRODUCT ||
      typeof parsed.feedbackId !== 'string' ||
      !/^FB-\d{8}-[A-Z0-9]{6}$/.test(parsed.feedbackId) ||
      !isFeedbackCategory(parsed.category) ||
      typeof parsed.message !== 'string' ||
      typeof parsed.createdAt !== 'string'
    ) {
      return null
    }
    return {
      feedbackId: parsed.feedbackId,
      category: parsed.category,
      message: parsed.message,
      contact: typeof parsed.contact === 'string' ? parsed.contact : undefined,
      diagnostics: isFeedbackDiagnostics(parsed.diagnostics) ? parsed.diagnostics : undefined,
      createdAt: parsed.createdAt,
    }
  } catch {
    return null
  }
}

export function extractFeedbackPayload(content: string): FeedbackPayload | null {
  return extractReadableFeedbackPayload(content) || extractMachineFeedbackPayload(content)
}

function extractReadableFeedbackPayload(content: string): FeedbackPayload | null {
  const normalized = content.replaceAll('\r\n', '\n')
  const feedbackId = readLine(normalized, '反馈编号')
  const categoryLabel = readLine(normalized, '反馈类型')
  const createdAt = readLine(normalized, '提交时间')
  const messageMatch = normalized.match(/(?:^|\n)反馈内容：\s*\n([\s\S]*?)\n+联系方式：([^\n]*)/)
  const message = messageMatch?.[1]?.trim() || ''
  const contact = messageMatch?.[2]?.trim() || ''
  const category = Object.entries(CATEGORY_LABELS).find(([, label]) => label === categoryLabel)?.[0]

  if (
    !feedbackId ||
    !/^FB-\d{8}-[A-Z0-9]{6}$/.test(feedbackId) ||
    !isFeedbackCategory(category) ||
    !createdAt ||
    !message
  ) {
    return null
  }

  const diagnostics = readDiagnostics(normalized)
  return {
    feedbackId,
    category,
    message,
    contact: contact && contact !== '未填写' ? contact : undefined,
    diagnostics,
    createdAt,
  }
}

function readDiagnostics(content: string): FeedbackDiagnostics | undefined {
  const diagnostics: FeedbackDiagnostics = {
    appVersion: readLine(content, '应用版本'),
    runtime: readLine(content, '运行环境'),
    platform: readLine(content, '系统平台'),
    viewport: readLine(content, '视口尺寸'),
    theme: readLine(content, '当前主题'),
    articleStats: readLine(content, '稿件统计'),
    warnings: readLine(content, '预检信息'),
    pageUrl: readLine(content, '页面地址'),
  }
  return Object.values(diagnostics).every(Boolean) ? diagnostics : undefined
}

function readLine(content: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.match(new RegExp(`(?:^|\\n)${escaped}：\\s*([^\\n]*)`))?.[1]?.trim() || ''
}

function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return value === 'problem' || value === 'suggestion' || value === 'experience' || value === 'other'
}

function isFeedbackDiagnostics(value: unknown): value is FeedbackDiagnostics {
  if (!value || typeof value !== 'object') return false
  const diagnostics = value as Record<string, unknown>
  return [
    'appVersion',
    'runtime',
    'platform',
    'viewport',
    'theme',
    'articleStats',
    'warnings',
    'pageUrl',
  ].every((key) => typeof diagnostics[key] === 'string')
}
