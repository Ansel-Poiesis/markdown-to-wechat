import { describe, expect, it } from 'vitest'
import { buildFeedbackMailto, FEEDBACK_EMAIL, formatFeedbackBody } from './feedback'

describe('feedback service', () => {
  const payload = {
    category: 'problem' as const,
    message: '复制后标题样式丢失。',
    contact: 'reader@example.com',
    createdAt: '2026-07-21T12:00:00.000Z',
    diagnostics: {
      appVersion: '2.0.1',
      runtime: 'Web',
      platform: 'Windows',
      viewport: '1440x900',
      theme: '秋河',
      articleStats: '500 字，4 个标题，0 张图片',
      warnings: '0 严重，1 提醒，0 信息',
      pageUrl: 'https://example.com/',
    },
  }

  it('formats feedback without article content', () => {
    const body = formatFeedbackBody(payload)

    expect(body).toContain('反馈类型：问题反馈')
    expect(body).toContain('复制后标题样式丢失。')
    expect(body).toContain('reader@example.com')
    expect(body).toContain('未附带文章正文')
  })

  it('builds a structured mailto link to the AI mailbox', () => {
    const mailto = buildFeedbackMailto(payload)
    const url = new URL(mailto)

    expect(url.pathname).toBe(FEEDBACK_EMAIL)
    expect(url.searchParams.get('subject')).toContain('问题反馈')
    expect(url.searchParams.get('body')).toContain('复制后标题样式丢失。')
  })
})
