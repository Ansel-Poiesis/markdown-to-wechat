import { describe, expect, it } from 'vitest'
import {
  buildFeedbackFormData,
  buildFeedbackMailto,
  createFeedbackId,
  FEEDBACK_EMAIL,
  formatFeedbackBody,
} from './feedback'
import {
  extractFeedbackPayload,
  extractMachineFeedbackPayload,
  formatMachineFeedbackBlock,
} from './feedback-protocol'

describe('feedback service', () => {
  const payload = {
    feedbackId: 'FB-20260721-ABC123',
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
    expect(body).toContain('反馈编号：FB-20260721-ABC123')
    expect(body).toContain('复制后标题样式丢失。')
    expect(body).toContain('reader@example.com')
    expect(body).toContain('未附带文章正文')
    expect(body).not.toContain('TASTELAB_FEEDBACK_V1')
    expect(extractFeedbackPayload(body)).toEqual(payload)
  })

  it('builds a structured mailto link to the AI mailbox', () => {
    const mailto = buildFeedbackMailto(payload)
    const url = new URL(mailto)

    expect(url.pathname).toBe(FEEDBACK_EMAIL)
    expect(url.searchParams.get('subject')).toContain('FB-20260721-ABC123')
    expect(url.searchParams.get('subject')).toContain('问题反馈')
    expect(url.searchParams.get('body')).toContain('复制后标题样式丢失。')
  })

  it('builds a FormSubmit payload without article content', () => {
    const form = buildFeedbackFormData(payload)

    expect(form.get('反馈编号')).toBe(payload.feedbackId)
    expect(form.get('反馈类型')).toBe('问题反馈')
    expect(form.get('反馈详情')).toContain('复制后标题样式丢失。')
    expect(form.get('反馈详情')).toContain('未附带文章正文')
    expect(form.get('_captcha')).toBe('false')
  })

  it('creates sortable feedback identifiers without exposing content', () => {
    expect(createFeedbackId(new Date('2026-07-21T12:00:00.000Z'), 0.5)).toMatch(
      /^FB-20260721-[A-Z0-9]{6}$/,
    )
  })

  it('continues to read legacy machine blocks', () => {
    expect(extractMachineFeedbackPayload(formatMachineFeedbackBlock(payload))).toEqual(payload)
  })
})
