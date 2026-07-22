import { describe, expect, it } from 'vitest'
import { formatFeedbackBody, type FeedbackPayload } from '../src/services/feedback-protocol'
import { createCandidateTask, createForwardDraft } from './feedback-inbox-core'

describe('feedback inbox', () => {
  const payload: FeedbackPayload = {
    feedbackId: 'FB-20260722-TEST01',
    category: 'problem',
    message: '移动端复制后标题颜色丢失。',
    contact: 'reader@example.com',
    createdAt: '2026-07-22T08:00:00.000Z',
  }

  it('turns a structured Agent Mail message into an untrusted candidate task', () => {
    const task = createCandidateTask(
      {
        message_id: 'msg_feedback_1',
        subject: '[微信 Markdown 排版][FB-20260722-TEST01][问题反馈]',
        body: formatFeedbackBody(payload),
        created_at: '2026-07-22T08:01:00.000Z',
        from: { email: 'reader@example.com' },
      },
      '2026-07-22T08:02:00.000Z',
    )

    expect(task).not.toBeNull()
    expect(task?.status).toBe('needs_review')
    expect(task?.trust).toBe('untrusted_external_input')
    expect(task?.payload).toEqual(payload)
  })

  it('prepares a confirmation-required personal inbox draft', () => {
    const task = createCandidateTask({
      message_id: 'msg_feedback_1',
      subject: '[微信 Markdown 排版][FB-20260722-TEST01][问题反馈]',
      body: formatFeedbackBody(payload),
      created_at: '2026-07-22T08:01:00.000Z',
    })

    const draft = createForwardDraft(task!, 'owner@example.com')
    expect(draft.to).toBe('owner@example.com')
    expect(draft.subject).toContain(payload.feedbackId)
    expect(draft.requiresConfirmation).toBe(true)
    expect(draft.body).toContain('不可信外部输入')
  })
})
