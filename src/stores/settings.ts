import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { MAGAZINE_DEFAULTS } from '@/config/themes'
import type {
  BoldMode,
  FontFamilyKey,
  HeadingMode,
  QuoteMode,
  QuoteMode2,
  H1Mode,
  UnderlineMode,
} from '@/types'

const PREVIEW_ZOOM_KEY = 'wechat-md-preview-zoom'
const FONT_FAMILY_KEY = 'wechat-md-font-family'
const FONT_SIZE_KEY = 'wechat-md-font-size'
const LINE_HEIGHT_KEY = 'wechat-md-line-height'
const CONTENT_WIDTH_KEY = 'wechat-md-content-width'
const PAGE_MARGIN_KEY = 'wechat-md-page-margin'
const PAGE_MARGIN_VERSION_KEY = 'wechat-md-page-margin-version'
const TEXT_COLOR_KEY = 'wechat-md-text-color'
const MUTED_COLOR_KEY = 'wechat-md-muted-color'
const BORDER_COLOR_KEY = 'wechat-md-border-color'
const BG_SOFT_COLOR_KEY = 'wechat-md-bg-soft-color'
const QUOTE_BG_COLOR_KEY = 'wechat-md-quote-bg-color'
const ACCENT_KEY = 'wechat-md-accent'
const TEXT_INDENT_KEY = 'wechat-md-text-indent'
const TEXT_JUSTIFY_KEY = 'wechat-md-text-justify'
const MAC_CODE_BLOCK_KEY = 'wechat-md-mac-code'
const CODE_LINE_NUMBERS_KEY = 'wechat-md-code-lines'
const H1_MODE_KEY = 'wechat-md-h1-mode'
const HEADING_MODE_KEY = 'wechat-md-heading-mode'
const H2_MODE_KEY = 'wechat-md-h2-mode'
const H3_MODE_KEY = 'wechat-md-h3-mode'
const H4_MODE_KEY = 'wechat-md-h4-mode'
const QUOTE_MODE_KEY = 'wechat-md-quote-mode'
const QUOTE_MODE2_KEY = 'wechat-md-quote-mode2'
const HEADING_COLOR_KEY = 'wechat-md-heading-color'
const H1_COLOR_KEY = 'wechat-md-h1-color'
const H2_COLOR_KEY = 'wechat-md-h2-color'
const H3_COLOR_KEY = 'wechat-md-h3-color'
const H4_COLOR_KEY = 'wechat-md-h4-color'
const HEADING_ACCENT_KEY = 'wechat-md-heading-accent'
const QUOTE_ACCENT_KEY = 'wechat-md-quote-accent'
const LETTER_SPACING_KEY = 'wechat-md-letter-spacing'
const PARAGRAPH_SPACING_KEY = 'wechat-md-para-spacing'
const BOLD_COLOR_KEY = 'wechat-md-bold-color'
const BOLD_MODE_KEY = 'wechat-md-bold-mode'
const UNDERLINE_COLOR_KEY = 'wechat-md-underline-color'
const UNDERLINE_MODE_KEY = 'wechat-md-underline-mode'
const CANVAS_COLOR_KEY = 'wechat-md-canvas-color'
const CUSTOM_COLOR_HISTORY_KEY = 'wechat-md-color-history'
const COLOR_PRESETS_KEY = 'wechat-md-color-presets'
const STYLE_PRESET_KEY = 'wechat-md-style-preset'

const VALID_FONT_SIZES = [12, 14, 16, 18, 20]
const VALID_LINE_HEIGHTS = [1, 1.6, 2, 2.6, 3]
const VALID_PAGE_MARGINS = [12, 20, 28, 34, 36]
const VALID_PARAGRAPH_SPACINGS = [0.5, 1, 1.5, 2, 2.5]
const VALID_TEXT_INDENTS = [0, 1, 2, 3, 4]
const VALID_LETTER_SPACINGS = ['', '0.6px', '1.2px', '2px', '4px']

export type ColorPresetKind = 'text' | 'accent' | 'background'

export const DEFAULT_COLOR_PRESETS: Record<ColorPresetKind, string[]> = {
  text: ['#18181b', '#27272a', '#334155', '#1f2937', '#3f3a33', '#24352b', '#3b3345', '#0f172a'],
  accent: ['#2563eb', '#0f766e', '#c2410c', '#b42318', '#7c3aed', '#be123c', '#a16207', '#4f46e5'],
  background: ['#ffffff', '#fafafa', '#f8fafc', '#f9fafb', '#fff7ed', '#f8f5f0', '#f5fbf8', '#f8f7ff'],
}

export const FONT_FAMILIES: Record<FontFamilyKey, { label: string; css: string }> = {
  sans: {
    label: '无衬线',
    css: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  serif: {
    label: '衬线',
    css: "'Optima', 'Songti SC', 'STSong', 'Noto Serif CJK SC', 'PingFang SC', 'Microsoft YaHei', serif",
  },
  mono: {
    label: '等宽',
    css: "'Menlo', 'Monaco', 'Courier New', 'PingFang SC', 'Microsoft YaHei', monospace",
  },
}

export type StylePresetKey = 'qiuhe' | 'songyan' | 'yuebai' | 'haitang' | 'qingdai' | 'liujin'

export const STYLE_PRESETS: Array<{
  key: StylePresetKey
  label: string
  description: string
  color: string
  settings: {
    fontFamilyKey: FontFamilyKey
    lineHeight: number
    pageMargin: number
    textColor: string
    mutedColor: string
    borderColor: string
    bgSoftColor: string
    quoteBgColor: string
    accentColor: string
    h1Mode: H1Mode
    h2Mode: HeadingMode
    h3Mode: HeadingMode
    h4Mode: HeadingMode
    quoteMode: QuoteMode
    quoteMode2: QuoteMode2
    textIndent: number
    textJustify: boolean
    h1Color: string
    h2Color: string
    h3Color: string
    h4Color: string
    headingAccent: string
    quoteAccent: string
    letterSpacing: string
    paragraphSpacing: number
    boldColor: string
    boldMode: BoldMode
    underlineColor: string
    underlineMode: UnderlineMode
    canvasColor: string
  }
}> = [
  {
    key: 'qiuhe',
    label: '秋河',
    description: '暖纸、陶土、深墨，适合叙事和慢节奏长文。',
    color: '#c45f38',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#2f2822',
      mutedColor: '#76675a',
      borderColor: '#ead8c6',
      bgSoftColor: '#fff3e7',
      quoteBgColor: '#fff1e4',
      accentColor: '#c45f38',
      h1Mode: 'center',
      h2Mode: 'plain',
      h3Mode: 'bar',
      h4Mode: 'plain',
      quoteMode: 'soft',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#332b24',
      h2Color: '#332b24',
      h3Color: '#332b24',
      h4Color: '#5f554d',
      headingAccent: '#c45f38',
      quoteAccent: '#c45f38',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#c45f38',
      boldMode: 'default',
      underlineColor: '#c45f38',
      underlineMode: 'solid',
      canvasColor: '#fffaf4',
    },
  },
  {
    key: 'songyan',
    label: '松烟',
    description: '冷灰层级、黑白主导，适合观点、报告和硬分析。',
    color: '#27272a',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#18181b',
      mutedColor: '#71717a',
      borderColor: '#e4e4e7',
      bgSoftColor: '#f4f4f5',
      quoteBgColor: '#f4f4f5',
      accentColor: '#27272a',
      h1Mode: 'underline',
      h2Mode: 'plain',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'bar',
      quoteMode2: 'bar',
      textIndent: 0,
      textJustify: true,
      h1Color: '#18181b',
      h2Color: '#18181b',
      h3Color: '#332b24',
      h4Color: '#5f554d',
      headingAccent: '#27272a',
      quoteAccent: '#52525b',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#18181b',
      boldMode: 'color',
      underlineColor: '#18181b',
      underlineMode: 'solid',
      canvasColor: '#fcfcfb',
    },
  },
  {
    key: 'yuebai',
    label: '月白',
    description: '月白底、蓝灰层，适合现代解释和信息密度高的稿件。',
    color: '#315f9c',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#172033',
      mutedColor: '#5f6f86',
      borderColor: '#dbe6f3',
      bgSoftColor: '#eef5ff',
      quoteBgColor: '#edf6ff',
      accentColor: '#315f9c',
      h1Mode: 'dash',
      h2Mode: 'bar',
      h3Mode: 'dash',
      h4Mode: 'plain',
      quoteMode: 'outline',
      quoteMode2: 'panel',
      textIndent: 0,
      textJustify: false,
      h1Color: '#172033',
      h2Color: '#1f3f68',
      h3Color: '#1f3f68',
      h4Color: '#5f6f86',
      headingAccent: '#315f9c',
      quoteAccent: '#315f9c',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#315f9c',
      boldMode: 'underline',
      underlineColor: '#315f9c',
      underlineMode: 'double',
      canvasColor: '#f8fbff',
    },
  },
  {
    key: 'qingdai',
    label: '青黛',
    description: '青绿、浅雾、低对比，适合生活观察和自然感说明。',
    color: '#2f7667',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#1f332d',
      mutedColor: '#61756d',
      borderColor: '#d8e8df',
      bgSoftColor: '#eef8f2',
      quoteBgColor: '#edf7f1',
      accentColor: '#2f7667',
      h1Mode: 'marker',
      h2Mode: 'bar',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'note',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#1f332d',
      h2Color: '#1f332d',
      h3Color: '#2f4a3d',
      h4Color: '#61756d',
      headingAccent: '#2f7667',
      quoteAccent: '#2f7667',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#2f7667',
      boldMode: 'marker',
      underlineColor: '#2f7667',
      underlineMode: 'dashed',
      canvasColor: '#f8fcf9',
    },
  },
  {
    key: 'haitang',
    label: '海棠',
    description: '玫红只作点睛，适合审美、情绪和带温度的表达。',
    color: '#b94662',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#422932',
      mutedColor: '#7a5f68',
      borderColor: '#efd7de',
      bgSoftColor: '#fff1f4',
      quoteBgColor: '#fff0f4',
      accentColor: '#b94662',
      h1Mode: 'center',
      h2Mode: 'chip',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'soft',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#422932',
      h2Color: '#422932',
      h3Color: '#5f3b46',
      h4Color: '#7a5f68',
      headingAccent: '#b94662',
      quoteAccent: '#b94662',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#b94662',
      boldMode: 'color',
      underlineColor: '#b94662',
      underlineMode: 'marker',
      canvasColor: '#fff9fa',
    },
  },
  {
    key: 'liujin',
    label: '流金',
    description: '琥珀明亮但克制，适合教程、清单和轻商业内容。',
    color: '#a16207',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#3c3322',
      mutedColor: '#746854',
      borderColor: '#eadcb8',
      bgSoftColor: '#fff6db',
      quoteBgColor: '#fff2c9',
      accentColor: '#a16207',
      h1Mode: 'panel',
      h2Mode: 'chip',
      h3Mode: 'marker',
      h4Mode: 'plain',
      quoteMode: 'note',
      quoteMode2: 'panel',
      textIndent: 0,
      textJustify: false,
      h1Color: '#3c3322',
      h2Color: '#3c3322',
      h3Color: '#6b4b18',
      h4Color: '#746854',
      headingAccent: '#a16207',
      quoteAccent: '#a16207',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#a16207',
      boldMode: 'marker',
      underlineColor: '#a16207',
      underlineMode: 'marker',
      canvasColor: '#fffaf0',
    },
  },
]

export const useSettingsStore = defineStore('settings', () => {
  const previewZoom = useStorage(PREVIEW_ZOOM_KEY, '1.25')

  // Typography — 暖色杂志默认值
  const fontFamilyKey = useStorage<FontFamilyKey>(FONT_FAMILY_KEY, MAGAZINE_DEFAULTS.fontFamilyKey)
  const fontSize = useStorage(FONT_SIZE_KEY, MAGAZINE_DEFAULTS.fontSize)
  const lineHeight = useStorage(LINE_HEIGHT_KEY, MAGAZINE_DEFAULTS.lineHeight)
  const contentWidth = useStorage(CONTENT_WIDTH_KEY, MAGAZINE_DEFAULTS.contentWidth)
  const pageMargin = useStorage(PAGE_MARGIN_KEY, MAGAZINE_DEFAULTS.pageMargin)
  const pageMarginVersion = useStorage(PAGE_MARGIN_VERSION_KEY, 0)

  // Colors
  const textColor = useStorage(TEXT_COLOR_KEY, MAGAZINE_DEFAULTS.textColor)
  const mutedColor = useStorage(MUTED_COLOR_KEY, MAGAZINE_DEFAULTS.mutedColor)
  const borderColor = useStorage(BORDER_COLOR_KEY, MAGAZINE_DEFAULTS.borderColor)
  const bgSoftColor = useStorage(BG_SOFT_COLOR_KEY, MAGAZINE_DEFAULTS.bgSoftColor)
  const quoteBgColor = useStorage(QUOTE_BG_COLOR_KEY, MAGAZINE_DEFAULTS.quoteBgColor)
  const accentColor = useStorage(ACCENT_KEY, MAGAZINE_DEFAULTS.accentColor)

  // Layout
  const textIndent = useStorage(TEXT_INDENT_KEY, MAGAZINE_DEFAULTS.textIndent)
  const textJustify = useStorage(TEXT_JUSTIFY_KEY, MAGAZINE_DEFAULTS.textJustify)

  // Code blocks
  const macCodeBlock = useStorage(MAC_CODE_BLOCK_KEY, MAGAZINE_DEFAULTS.macCodeBlock)
  const codeLineNumbers = useStorage(CODE_LINE_NUMBERS_KEY, MAGAZINE_DEFAULTS.codeLineNumbers)

  // Heading & quote styles — 杂志默认值
  const h1Mode = useStorage<H1Mode>(H1_MODE_KEY, MAGAZINE_DEFAULTS.h1Mode)
  const headingMode = useStorage<HeadingMode>(HEADING_MODE_KEY, MAGAZINE_DEFAULTS.headingMode)
  const h2Mode = useStorage<HeadingMode>(H2_MODE_KEY, MAGAZINE_DEFAULTS.h2Mode)
  const h3Mode = useStorage<HeadingMode>(H3_MODE_KEY, MAGAZINE_DEFAULTS.h3Mode)
  const h4Mode = useStorage<HeadingMode>(H4_MODE_KEY, MAGAZINE_DEFAULTS.h4Mode)
  const quoteMode = useStorage<QuoteMode>(QUOTE_MODE_KEY, MAGAZINE_DEFAULTS.quoteMode)
  const quoteMode2 = useStorage<QuoteMode2>(QUOTE_MODE2_KEY, MAGAZINE_DEFAULTS.quoteMode2)

  // 独立颜色覆盖
  const legacyHeadingColor = useStorage(HEADING_COLOR_KEY, '')
  const h1Color = useStorage(H1_COLOR_KEY, MAGAZINE_DEFAULTS.h1Color || legacyHeadingColor.value)
  const h2Color = useStorage(H2_COLOR_KEY, MAGAZINE_DEFAULTS.h2Color || legacyHeadingColor.value)
  const h3Color = useStorage(H3_COLOR_KEY, MAGAZINE_DEFAULTS.h3Color || legacyHeadingColor.value)
  const h4Color = useStorage(H4_COLOR_KEY, MAGAZINE_DEFAULTS.h4Color || legacyHeadingColor.value)
  const headingAccent = useStorage(HEADING_ACCENT_KEY, MAGAZINE_DEFAULTS.headingAccent)
  const quoteAccent = useStorage(QUOTE_ACCENT_KEY, MAGAZINE_DEFAULTS.quoteAccent)
  const boldColor = useStorage(BOLD_COLOR_KEY, MAGAZINE_DEFAULTS.boldColor)
  const boldMode = useStorage<BoldMode>(BOLD_MODE_KEY, MAGAZINE_DEFAULTS.boldMode)

  // 扩展排版
  const letterSpacing = useStorage(LETTER_SPACING_KEY, MAGAZINE_DEFAULTS.letterSpacing)
  const paragraphSpacing = useStorage(PARAGRAPH_SPACING_KEY, MAGAZINE_DEFAULTS.paragraphSpacing)
  const underlineColor = useStorage(UNDERLINE_COLOR_KEY, MAGAZINE_DEFAULTS.underlineColor)
  const underlineMode = useStorage<UnderlineMode>(
    UNDERLINE_MODE_KEY,
    MAGAZINE_DEFAULTS.underlineMode,
  )
  const canvasColor = useStorage(CANVAS_COLOR_KEY, MAGAZINE_DEFAULTS.canvasColor)
  const colorHistory = useStorage<string[]>(CUSTOM_COLOR_HISTORY_KEY, [])
  const activeStylePreset = useStorage<StylePresetKey | ''>(STYLE_PRESET_KEY, '')
  const colorPresets = useStorage<Record<ColorPresetKind, string[]>>(
    COLOR_PRESETS_KEY,
    DEFAULT_COLOR_PRESETS,
  )

  if (!VALID_FONT_SIZES.includes(Number(fontSize.value))) fontSize.value = MAGAZINE_DEFAULTS.fontSize
  if (!VALID_LINE_HEIGHTS.includes(Number(lineHeight.value))) {
    lineHeight.value = MAGAZINE_DEFAULTS.lineHeight
  }
  if (pageMarginVersion.value < 2 && Number(pageMargin.value) === 24) {
    pageMargin.value = MAGAZINE_DEFAULTS.pageMargin
    pageMarginVersion.value = 2
  }
  if (!VALID_PAGE_MARGINS.includes(Number(pageMargin.value))) {
    pageMargin.value = MAGAZINE_DEFAULTS.pageMargin
  }
  if (!VALID_PARAGRAPH_SPACINGS.includes(Number(paragraphSpacing.value))) {
    paragraphSpacing.value = MAGAZINE_DEFAULTS.paragraphSpacing
  }
  if (!VALID_TEXT_INDENTS.includes(Number(textIndent.value))) {
    textIndent.value = MAGAZINE_DEFAULTS.textIndent
  }
  if (!VALID_LETTER_SPACINGS.includes(letterSpacing.value)) {
    letterSpacing.value = MAGAZINE_DEFAULTS.letterSpacing
  }
  colorPresets.value = {
    text: normalizePresetList(colorPresets.value.text, DEFAULT_COLOR_PRESETS.text),
    accent: normalizePresetList(colorPresets.value.accent, DEFAULT_COLOR_PRESETS.accent),
    background: normalizePresetList(colorPresets.value.background, DEFAULT_COLOR_PRESETS.background),
  }

  const previewZoomComputed = computed({
    get: () => previewZoom.value,
    set: (v) => {
      previewZoom.value = v
    },
  })

  const rememberColor = (color: string) => {
    const normalized = color.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return
    colorHistory.value = [
      normalized.toLowerCase(),
      ...colorHistory.value.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, 6)
  }

  const updateColorPreset = (kind: ColorPresetKind, index: number, color: string) => {
    const normalized = normalizeHexColor(color)
    if (!normalized) return
    const next = normalizePresetList(colorPresets.value[kind], DEFAULT_COLOR_PRESETS[kind])
    if (!next[index]) return
    next[index] = normalized
    colorPresets.value = {
      ...colorPresets.value,
      [kind]: next,
    }
  }

  const applyStylePreset = (key: StylePresetKey) => {
    const preset = STYLE_PRESETS.find((item) => item.key === key)
    if (!preset) return
    const next = preset.settings
    fontFamilyKey.value = next.fontFamilyKey
    lineHeight.value = next.lineHeight
    pageMargin.value = next.pageMargin
    textColor.value = next.textColor
    mutedColor.value = next.mutedColor
    borderColor.value = next.borderColor
    bgSoftColor.value = next.bgSoftColor
    quoteBgColor.value = next.quoteBgColor
    accentColor.value = next.accentColor
    h1Mode.value = next.h1Mode
    h2Mode.value = next.h2Mode
    h3Mode.value = next.h3Mode
    h4Mode.value = next.h4Mode
    quoteMode.value = next.quoteMode
    quoteMode2.value = next.quoteMode2
    textIndent.value = next.textIndent
    textJustify.value = next.textJustify
    h1Color.value = next.h1Color
    h2Color.value = next.h2Color
    h3Color.value = next.h3Color
    h4Color.value = next.h4Color
    headingAccent.value = next.headingAccent
    quoteAccent.value = next.quoteAccent
    letterSpacing.value = next.letterSpacing
    paragraphSpacing.value = next.paragraphSpacing
    boldColor.value = next.boldColor
    boldMode.value = next.boldMode
    underlineColor.value = next.underlineColor
    underlineMode.value = next.underlineMode
    canvasColor.value = next.canvasColor
    activeStylePreset.value = key
  }

  return {
    previewZoom: previewZoomComputed,
    rememberColor,
    updateColorPreset,
    applyStylePreset,
    fontFamilyKey,
    fontSize,
    lineHeight,
    contentWidth,
    pageMargin,
    textColor,
    mutedColor,
    borderColor,
    bgSoftColor,
    quoteBgColor,
    accentColor,
    textIndent,
    textJustify,
    macCodeBlock,
    codeLineNumbers,
    h1Mode,
    headingMode,
    h2Mode,
    h3Mode,
    h4Mode,
    quoteMode,
    quoteMode2,
    h1Color,
    h2Color,
    h3Color,
    h4Color,
    headingAccent,
    quoteAccent,
    boldColor,
    boldMode,
    letterSpacing,
    paragraphSpacing,
    underlineColor,
    underlineMode,
    canvasColor,
    colorHistory,
    colorPresets,
    activeStylePreset,
  }
})

function normalizeHexColor(color: string) {
  const normalized = color.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : ''
}

function normalizePresetList(value: string[] | undefined, fallback: string[]) {
  const source = Array.isArray(value) ? value : []
  return fallback.map((fallbackColor, index) => normalizeHexColor(source[index] || '') || fallbackColor)
}
