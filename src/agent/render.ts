import { renderWechatMarkdown, toHtmlDocument } from '@/services/wechatRenderer'
import { AgentContractError, validateAgentRequest, type AgentRenderRequest } from './contract'
import { createImagegenBrief } from './imagegen'

/** CLI resolves inputPath before entering this exact same browser-safe rendering path. */
export function renderAgentArticle(input: AgentRenderRequest) {
  const request = validateAgentRequest(input, 'browser')
  if (request.markdown === undefined)
    throw new AgentContractError('INVALID_REQUEST', '渲染需要已解析的 Markdown 正文')
  const rendered = renderWechatMarkdown(request.markdown, {
    ...request.options,
    theme: request.theme,
    profile: request.profile,
  })
  const compatibility = {
    profile: request.profile,
    status:
      request.profile === 'generic'
        ? ('not_applicable' as const)
        : rendered.valid
          ? ('passed' as const)
          : ('failed' as const),
    issues: rendered.issues,
    scope:
      request.profile === 'wechat'
        ? 'static_html_gate; actual platform paste needs review'
        : 'generic HTML; WeChat compatibility not checked',
  }
  const status =
    compatibility.status === 'failed'
      ? ('compatibility_failed' as const)
      : request.output === 'imagegen-long'
        ? ('waiting_for_imagegen' as const)
        : ('rendered_needs_review' as const)
  const imagegen =
    request.output === 'imagegen-long'
      ? createImagegenBrief(request.markdown, {
          style: request.imagegen?.style,
          title: request.title,
        })
      : undefined
  return {
    request,
    rendered,
    document: toHtmlDocument(rendered.html, request.title, request.profile),
    compatibility,
    status,
    ...(imagegen ? { imagegen } : {}),
  }
}
