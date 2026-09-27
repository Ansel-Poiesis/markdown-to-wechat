import { codeThemes } from '@/config/themes'
import { FONT_FAMILIES } from '@/config/typography'
import { STYLE_PRESETS } from '@/stores/settings'
import {
  resolveRenderWechatOptions,
  type ResolvedRenderWechatOptions,
  type RenderWechatOptions,
} from '@/services/wechatRenderer'
import { MARKDOWN_RENDER_LIMITS } from '@/utils/markdownRenderer'
import { IMAGEGEN_MAX_SOURCE_LENGTH, imagegenStyles, type ImagegenStyle } from './imagegen'

export const AGENT_REQUEST_MAX_CHARS = 8 * 1024 * 1024
export type AgentContext = 'browser' | 'cli'
export type AgentOutput = 'wechat' | 'html' | 'imagegen-long'
export type AgentOptions = Omit<ResolvedRenderWechatOptions, 'theme' | 'profile'>
export interface AgentRenderRequest {
  schemaVersion: 1
  taskId: string
  markdown?: string
  inputPath?: string
  output: AgentOutput
  theme: ResolvedRenderWechatOptions['theme']
  profile: ResolvedRenderWechatOptions['profile']
  title: string
  options: AgentOptions
  imagegen?: { style: ImagegenStyle }
}

export class AgentContractError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AgentContractError'
  }
}

function fail(message: string): never {
  throw new AgentContractError('INVALID_REQUEST', message)
}

function object(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    return fail(`${label} 必须是普通 JSON 对象`)
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !keys.includes(key)) fail(`${label} 含未知字段：${String(key)}`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor?.enumerable || !('value' in descriptor)) fail(`${label} 不接受访问器或隐藏字段`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || value.length > max || value.includes('\0'))
    fail(`${label} 必须是最多 ${max} 字符且无 NUL 的字符串`)
  return value as string
}

function oneOf<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T))
    fail(`${label} 必须是 ${choices.join(' / ')}`)
  return value as T
}

export function isAgentTaskId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value) &&
    !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(value)
  )
}

/** No filesystem, network, eval or provider calls: safe to share with the browser. */
export function validateAgentRequest(
  value: unknown,
  context: AgentContext = 'browser',
): AgentRenderRequest {
  if (context !== 'browser' && context !== 'cli') fail('未知校验上下文')
  const request = object(
    value,
    [
      'schemaVersion',
      'taskId',
      'markdown',
      'inputPath',
      'output',
      'theme',
      'profile',
      'title',
      'options',
      'imagegen',
    ],
    'request',
  )
  if (request.schemaVersion !== 1) fail('schemaVersion 必须是 1')
  if (!isAgentTaskId(request.taskId))
    fail(
      'taskId 必须是 1–64 位 ASCII 字母/数字/下划线/短横线，以字母或数字开头，且不是系统保留名称',
    )
  const hasMarkdown = Object.hasOwn(request, 'markdown')
  const hasPath = Object.hasOwn(request, 'inputPath')
  if (hasMarkdown === hasPath) fail('markdown 与 inputPath 必须且只能提供一个')
  if (hasPath && context !== 'cli') fail('浏览器请求不接受 inputPath；请导入 Markdown 正文')
  const output = oneOf(
    request.output === undefined ? 'wechat' : request.output,
    ['wechat', 'html', 'imagegen-long'] as const,
    'output',
  )
  const theme = oneOf(
    request.theme === undefined ? 'qiuhe' : request.theme,
    STYLE_PRESETS.map((item) => item.key),
    'theme',
  )
  const profile = oneOf(
    request.profile === undefined ? (output === 'wechat' ? 'wechat' : 'generic') : request.profile,
    ['wechat', 'generic'] as const,
    'profile',
  )
  if (output === 'wechat' && profile !== 'wechat') fail('wechat 输出必须使用 wechat profile')
  const markdown = hasMarkdown
    ? string(
        request.markdown,
        'markdown',
        output === 'imagegen-long' ? IMAGEGEN_MAX_SOURCE_LENGTH : MARKDOWN_RENDER_LIMITS.inputChars,
      )
    : undefined
  if (hasMarkdown && !markdown?.trim()) fail('markdown 不能为空')
  const inputPath = hasPath ? string(request.inputPath, 'inputPath', 4096) : undefined
  if (hasPath && !inputPath?.trim()) fail('inputPath 不能为空')
  const title =
    request.title === undefined
      ? (request.taskId as string)
      : string(request.title, 'title', 180).trim()
  if (!title) fail('title 不能为空')
  const optionKeys = [
    'codeTheme',
    'fontFamily',
    'fontSize',
    'lineHeight',
    'pageMargin',
    'accent',
    'textColor',
    'canvas',
    'toc',
    'endMark',
    'endMarkText',
  ]
  const rawOptions =
    request.options === undefined ? {} : object(request.options, optionKeys, 'options')
  for (const name of ['fontSize', 'lineHeight', 'pageMargin']) {
    if (
      Object.hasOwn(rawOptions, name) &&
      (typeof rawOptions[name] !== 'number' || !Number.isFinite(rawOptions[name]))
    )
      fail(`${name} 必须是有限数字`)
  }
  for (const name of ['accent', 'textColor', 'canvas']) {
    if (
      Object.hasOwn(rawOptions, name) &&
      (typeof rawOptions[name] !== 'string' ||
        !/^#[0-9a-fA-F]{6}$/.test(rawOptions[name] as string))
    )
      fail(`${name} 必须是 #RRGGBB`)
  }
  if (Object.hasOwn(rawOptions, 'codeTheme'))
    oneOf(rawOptions.codeTheme, Object.keys(codeThemes), 'codeTheme')
  if (Object.hasOwn(rawOptions, 'fontFamily'))
    oneOf(rawOptions.fontFamily, Object.keys(FONT_FAMILIES), 'fontFamily')
  for (const name of ['toc', 'endMark']) {
    if (Object.hasOwn(rawOptions, name)) oneOf(rawOptions[name], ['theme', 'show', 'hide'], name)
  }
  if (Object.hasOwn(rawOptions, 'endMarkText')) string(rawOptions.endMarkText, 'endMarkText', 2000)
  let resolved: ResolvedRenderWechatOptions
  try {
    resolved = resolveRenderWechatOptions({ ...rawOptions, theme, profile } as RenderWechatOptions)
  } catch (error) {
    return fail(error instanceof Error ? error.message : '无效渲染参数')
  }
  const { theme: resolvedTheme, profile: resolvedProfile, ...options } = resolved
  let imagegen: AgentRenderRequest['imagegen']
  if (request.imagegen !== undefined) {
    if (output !== 'imagegen-long') fail('imagegen 参数只用于 imagegen-long 输出')
    const settings = object(request.imagegen, ['style'], 'imagegen')
    imagegen = {
      style: oneOf(
        settings.style === undefined ? 'editorial' : settings.style,
        imagegenStyles.map((item) => item.id),
        'imagegen.style',
      ),
    }
  } else if (output === 'imagegen-long') imagegen = { style: 'editorial' }
  return {
    schemaVersion: 1,
    taskId: request.taskId as string,
    output,
    theme: resolvedTheme,
    profile: resolvedProfile,
    title,
    options,
    ...(hasMarkdown ? { markdown } : { inputPath }),
    ...(imagegen ? { imagegen } : {}),
  }
}

export function parseAgentRequest(
  json: string,
  context: AgentContext = 'browser',
): AgentRenderRequest {
  if (typeof json !== 'string' || json.length > AGENT_REQUEST_MAX_CHARS)
    fail('请求 JSON 超出字符上限')
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return fail('请求不是有效 JSON')
  }
  return validateAgentRequest(value, context)
}

export function discoverAgentCapabilities() {
  return {
    schemaVersion: 1,
    name: 'markdown-renderer-agent',
    commands: ['discover', 'validate', 'render', 'attach-image'],
    requestFields: [
      'schemaVersion',
      'taskId',
      'markdown',
      'inputPath',
      'output',
      'theme',
      'profile',
      'title',
      'options',
      'imagegen',
    ],
    input: {
      oneOf: ['markdown', 'inputPath'],
      browser: 'markdown only',
      cliPathsRelativeTo: 'request JSON directory',
      unknownFields: 'rejected',
    },
    outputs: ['wechat', 'html', 'imagegen-long'],
    profiles: ['wechat', 'generic'],
    themes: STYLE_PRESETS.map((item) => ({ id: item.key, label: item.label })),
    codeThemes: Object.keys(codeThemes),
    fonts: Object.keys(FONT_FAMILIES),
    imagegenStyles,
    limits: {
      requestChars: AGENT_REQUEST_MAX_CHARS,
      ...MARKDOWN_RENDER_LIMITS,
      imagegenSourceChars: IMAGEGEN_MAX_SOURCE_LENGTH,
      titleChars: 180,
      endMarkTextChars: 2000,
    },
    optionRanges: {
      fontSize: [10, 32],
      lineHeight: [1, 3],
      pageMargin: [0, 48],
      colors: '#RRGGBB',
      toc: ['theme', 'show', 'hide'],
      endMark: ['theme', 'show', 'hide'],
    },
    lifecycle: [
      'rendered_needs_review',
      'compatibility_failed',
      'waiting_for_imagegen',
      'needs_review',
    ],
    publication:
      'not_started; hand off to current yxer validate and dry-run rules, publish requires separate user authorization',
    imagegen:
      'prepare brief only; invoke Codex imagegen in a capable agent session, then attach actual image; never automatic publication',
    exitCodes: {
      0: 'command completed; inspect status, not human approval',
      1: 'invalid request, render or IO error',
      2: 'WeChat compatibility failed',
      3: 'job conflict or invalid state',
      4: 'invalid image or integrity check failed',
    },
  }
}
