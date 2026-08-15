import { codeThemes, MAGAZINE_DEFAULTS, themes } from '@/config/themes'
import { FONT_FAMILIES } from '@/config/typography'
import { STYLE_PRESETS } from '@/stores/settings'
import type {
  CodeTheme,
  DesignThemeKey,
  EndMarkMode,
  FontFamilyKey,
  ThemeBase,
  TocMode,
  WarningItem,
} from '@/types'
import { escapeHtml, renderMarkdown } from '@/utils/markdownRenderer'
import { validateWechatHtml } from '@/utils/wechatHtml'

export interface RenderWechatOptions {
  profile?: 'wechat' | 'generic'
  theme?: DesignThemeKey
  codeTheme?: string
  fontFamily?: FontFamilyKey
  fontSize?: number
  lineHeight?: number
  pageMargin?: number
  accent?: string
  textColor?: string
  canvas?: string
  toc?: TocMode
  endMark?: EndMarkMode
  endMarkText?: string
}

export interface ResolvedRenderWechatOptions {
  profile: 'wechat' | 'generic'
  theme: DesignThemeKey
  codeTheme: string
  fontFamily: FontFamilyKey
  fontSize: number
  lineHeight: number
  pageMargin: number
  accent: string
  textColor: string
  canvas: string
  toc: TocMode
  endMark: EndMarkMode
  endMarkText: string
}

export interface RenderWechatResult {
  html: string
  valid: boolean
  issues: WarningItem[]
  options: ResolvedRenderWechatOptions
}

export const DEFAULT_RENDER_WECHAT_OPTIONS: ResolvedRenderWechatOptions = {
  profile: 'wechat',
  theme: 'qiuhe',
  codeTheme: 'paper',
  fontFamily: 'serif',
  fontSize: MAGAZINE_DEFAULTS.fontSize,
  lineHeight: MAGAZINE_DEFAULTS.lineHeight,
  pageMargin: MAGAZINE_DEFAULTS.pageMargin,
  accent: '#a94f32',
  textColor: '#28241f',
  canvas: '#fffdf9',
  toc: 'theme',
  endMark: 'theme',
  endMarkText: '',
}

export function renderWechatMarkdown(
  markdown: string,
  options: RenderWechatOptions = {},
): RenderWechatResult {
  const resolved = resolveRenderWechatOptions(options)
  const html = renderMarkdown(
    markdown,
    createRenderTheme(resolved),
    codeThemes[resolved.codeTheme] as CodeTheme,
    resolved.profile === 'generic'
      ? { linkMode: 'inline', leafify: false }
      : { linkMode: 'footnote', leafify: true },
  )
  const validation =
    resolved.profile === 'generic'
      ? { valid: true, issues: [], leafCount: 0 }
      : validateWechatHtml(html)

  return {
    html,
    valid: validation.valid,
    issues: validation.issues,
    options: resolved,
  }
}

export function resolveRenderWechatOptions(
  options: RenderWechatOptions = {},
): ResolvedRenderWechatOptions {
  const profile = options.profile ?? DEFAULT_RENDER_WECHAT_OPTIONS.profile
  if (profile !== 'wechat' && profile !== 'generic') {
    throw new Error('profile 必须是 wechat 或 generic')
  }
  const theme = options.theme ?? DEFAULT_RENDER_WECHAT_OPTIONS.theme
  const preset = STYLE_PRESETS.find((item) => item.key === theme)
  if (!preset) throw new Error(`未知主题：${theme}`)

  const codeTheme = options.codeTheme ?? DEFAULT_RENDER_WECHAT_OPTIONS.codeTheme
  if (!codeThemes[codeTheme]) throw new Error(`未知代码主题：${codeTheme}`)

  const fontFamily = options.fontFamily ?? preset.settings.fontFamilyKey
  if (!FONT_FAMILIES[fontFamily]) throw new Error(`未知字体：${fontFamily}`)

  const fontSize = numberInRange('fontSize', options.fontSize ?? MAGAZINE_DEFAULTS.fontSize, 10, 32)
  const lineHeight = numberInRange(
    'lineHeight',
    options.lineHeight ?? preset.settings.lineHeight,
    1,
    3,
  )
  const pageMargin = numberInRange(
    'pageMargin',
    options.pageMargin ?? preset.settings.pageMargin,
    0,
    48,
  )
  const toc = options.toc ?? 'theme'
  const endMark = options.endMark ?? 'theme'
  if (!['theme', 'show', 'hide'].includes(toc)) throw new Error('toc 必须是 theme、show 或 hide')
  if (!['theme', 'show', 'hide'].includes(endMark)) {
    throw new Error('endMark 必须是 theme、show 或 hide')
  }

  return {
    profile,
    theme,
    codeTheme,
    fontFamily,
    fontSize,
    lineHeight,
    pageMargin,
    accent: colorOrDefault('accent', options.accent, preset.settings.accentColor),
    textColor: colorOrDefault('textColor', options.textColor, preset.settings.textColor),
    canvas: colorOrDefault('canvas', options.canvas, preset.settings.canvasColor),
    toc,
    endMark,
    endMarkText: options.endMarkText?.trim() ?? '',
  }
}

export function toHtmlDocument(
  html: string,
  title = '微信公众号排版导出',
  profile: 'wechat' | 'generic' = 'wechat',
): string {
  const style =
    profile === 'generic'
      ? `<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;padding:48px 20px;background:#f6f5f2;color:#1f2933;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body>section{max-width:760px;margin:0 auto;box-shadow:0 1px 3px rgba(31,41,51,.06),0 12px 32px rgba(31,41,51,.08);
  border:1px solid rgba(31,41,51,.06)}
a{color:#176b52;text-decoration:none}
a:hover{text-decoration:underline}
pre{overflow-x:auto;-webkit-overflow-scrolling:touch}
img{max-width:100%}
@media (max-width:640px){body{padding:0}body>section{border:0;border-radius:0;box-shadow:none}}
@media print{body{background:#fff;padding:0}body>section{box-shadow:none;border:0}}
</style>`
      : ''
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    ${style}
  </head>
  <body>
    ${html}
  </body>
</html>`
}

function createRenderTheme(options: ResolvedRenderWechatOptions): ThemeBase {
  const preset = STYLE_PRESETS.find((item) => item.key === options.theme)
  if (!preset) throw new Error(`未知主题：${options.theme}`)
  const settings = preset.settings
  const base = themes.magazine?.base
  if (!base) throw new Error('缺少基础排版主题')

  return {
    ...base,
    fontFamily: FONT_FAMILIES[options.fontFamily].css,
    fontSize: options.fontSize,
    lineHeight: options.lineHeight,
    width: MAGAZINE_DEFAULTS.contentWidth,
    pageMargin: options.pageMargin,
    color: options.textColor,
    muted: settings.mutedColor,
    border: settings.borderColor,
    bgSoft: settings.bgSoftColor,
    quoteBg: settings.quoteBgColor,
    accent: options.accent,
    h1Mode: settings.h1Mode,
    headingMode: settings.h2Mode,
    h2Mode: settings.h2Mode,
    h3Mode: settings.h3Mode,
    h4Mode: settings.h4Mode,
    quoteMode: settings.quoteMode,
    quoteMode2: settings.quoteMode2,
    textIndent: settings.textIndent,
    textJustify: settings.textJustify,
    macCodeBlock: MAGAZINE_DEFAULTS.macCodeBlock,
    codeLineNumbers: MAGAZINE_DEFAULTS.codeLineNumbers,
    h1Color: settings.h1Color,
    h2Color: settings.h2Color,
    h3Color: settings.h3Color,
    h4Color: settings.h4Color,
    headingAccent: settings.headingAccent,
    quoteAccent: settings.quoteAccent,
    letterSpacing: settings.letterSpacing,
    paragraphSpacing: settings.paragraphSpacing,
    boldColor: settings.boldColor,
    boldMode: settings.boldMode,
    underlineColor: settings.underlineColor,
    underlineMode: settings.underlineMode,
    canvas: options.canvas,
    designKey: options.theme,
    componentOverrides: {
      tocMode: options.toc,
      endMarkMode: options.endMark,
      endMarkText: options.endMarkText || undefined,
    },
  }
}

function numberInRange(name: string, value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} 必须是 ${minimum} 到 ${maximum} 之间的数字`)
  }
  return value
}

function colorOrDefault(name: string, value: string | undefined, fallback: string): string {
  const color = value?.trim() || fallback
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error(`${name} 必须是 #RRGGBB 颜色`)
  return color.toLowerCase()
}
