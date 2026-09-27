import { describe, expect, it } from 'vitest'
import {
  AgentContractError,
  discoverAgentCapabilities,
  parseAgentRequest,
  validateAgentRequest,
} from './contract'
import { renderAgentArticle } from './render'
import { renderWechatMarkdown } from '@/services/wechatRenderer'

const base = { schemaVersion: 1, taskId: 'test-01', markdown: '# 标题\n\n正文' }

describe('strict shared agent contract', () => {
  it('normalizes defaults and advertises actual installed themes', () => {
    const request = validateAgentRequest(base)
    expect(request).toMatchObject({
      output: 'wechat',
      profile: 'wechat',
      theme: 'qiuhe',
      title: 'test-01',
    })
    expect(discoverAgentCapabilities().themes).toHaveLength(9)
    expect(validateAgentRequest(request)).toEqual(request)
  })

  it.each([
    { ...base, schemaVersion: 2 },
    { ...base, taskId: '../escape' },
    { ...base, taskId: 'NUL' },
    { ...base, taskId: '中文' },
    { ...base, inputPath: 'a.md' },
    { ...base, markdown: '' },
    { ...base, output: null },
    { ...base, theme: 'constructor' },
    { ...base, token: 'private' },
    { ...base, profile: 'generic', output: 'wechat' },
    { ...base, options: { fontSize: '16' } },
    { ...base, options: { fontSize: 99 } },
    { ...base, options: { fontSize: NaN } },
    { ...base, options: { canvas: 'url(https://bad)' } },
    { ...base, options: { codeTheme: 'toString' } },
    { ...base, options: { endMarkText: 'x'.repeat(2001) } },
    { ...base, options: { secret: true } },
    { ...base, imagegen: { style: 'editorial' } },
    { ...base, output: 'imagegen-long', markdown: 'x'.repeat(4001) },
    { ...base, output: 'imagegen-long', imagegen: { style: null } },
    { ...base, output: 'imagegen-long', imagegen: { style: 'ink', apiKey: 'x' } },
  ])('rejects invalid or unknown fields %#', (value) => {
    expect(() => validateAgentRequest(value)).toThrow(AgentContractError)
  })

  it('rejects prototype keys, non-JSON accessors, array and malformed JSON', () => {
    for (const json of [
      '[]',
      '{',
      JSON.stringify(base).replace('"schemaVersion":1', '"schemaVersion":1,"__proto__":{}'),
    ]) {
      expect(() => parseAgentRequest(json)).toThrow(AgentContractError)
    }
    const request = { ...base }
    Object.defineProperty(request, 'markdown', {
      get() {
        throw new Error('must not run')
      },
    })
    expect(() => validateAgentRequest(request)).toThrow('访问器')
  })

  it('permits inputPath in CLI validation only and never in renderer', () => {
    const request = { schemaVersion: 1, taskId: 'path-01', inputPath: '稿件.md' }
    expect(validateAgentRequest(request, 'cli').inputPath).toBe('稿件.md')
    expect(() => validateAgentRequest(request)).toThrow('浏览器')
    expect(() => renderAgentArticle(validateAgentRequest(request, 'cli'))).toThrow('浏览器')
  })

  it('uses the deterministic renderer and distinguishes generic compatibility', () => {
    const request = validateAgentRequest({ ...base, output: 'html', theme: 'songyan' })
    const result = renderAgentArticle(request)
    expect(result.rendered).toEqual(
      renderWechatMarkdown(base.markdown, {
        ...request.options,
        theme: request.theme,
        profile: request.profile,
      }),
    )
    expect(result.status).toBe('rendered_needs_review')
    expect(result.compatibility.status).toBe('not_applicable')
  })

  it('prepares an imagegen brief without claiming a generated image', () => {
    const result = renderAgentArticle(
      validateAgentRequest({ ...base, output: 'imagegen-long', imagegen: { style: 'ink' } }),
    )
    expect(result.status).toBe('waiting_for_imagegen')
    expect(result.imagegen?.sourceText).toBe(base.markdown)
    expect(result.imagegen?.style).toBe('ink')
    expect(result.imagegen).not.toHaveProperty('image')
  })
})
