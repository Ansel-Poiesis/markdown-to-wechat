import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildFeedbackMailto, submitFeedback, type FeedbackPayload } from './feedback'

const payload: FeedbackPayload = {
  feedbackId: 'FB-20260927-ABC123',
  category: 'problem',
  message: '界面出现错误',
  createdAt: '2026-09-27T00:00:00Z',
  diagnostics: {
    appVersion: '2.0.1',
    runtime: 'Web',
    platform: 'test',
    viewport: '1000x800',
    theme: '秋河',
    articleStats: '5 字',
    warnings: '无',
    pageUrl: 'https://example.com/?token=private-secret#draft=private-article',
  },
}

describe('Feedback privacy/acknowledgement red team (mock network)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: { href: 'https://example.com/' },
      setTimeout,
      clearTimeout,
    })
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://feedback.invalid/submit')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('removes query and fragment secrets from diagnostics in email drafts', () => {
    const body = new URL(buildFeedbackMailto(payload)).searchParams.get('body')!
    expect(body).not.toContain('private-secret')
    expect(body).not.toContain('private-article')
  })
  it('does not send unknown payload properties to custom endpoints', async () => {
    const fetch = vi.fn(async () => new Response('{"accepted":true}'))
    vi.stubGlobal('fetch', fetch)
    await submitFeedback(
      Object.assign({}, payload, { articleContent: 'PRIVATE ARTICLE', apiKey: 'PRIVATE KEY' }),
    )
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ body: expect.not.stringContaining('PRIVATE') }),
    )
  })
  it('requires an explicit receipt instead of treating HTTP 200 as acceptance', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"accepted":false}')),
    )
    await expect(submitFeedback(payload)).rejects.toThrow()
  })
  it('does not allow non-HTTP local endpoint protocols', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'ftp://localhost/submit')
    const fetch = vi.fn(async () => new Response('{"accepted":true}'))
    vi.stubGlobal('fetch', fetch)
    await expect(submitFeedback(payload)).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
