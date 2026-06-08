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
const WECHAT_ELEMENTS_KEY = 'wechat-md-wechat-elements'
const FONT_FAMILY_KEY = 'wechat-md-font-family'
const FONT_SIZE_KEY = 'wechat-md-font-size'
const LINE_HEIGHT_KEY = 'wechat-md-line-height'
const CONTENT_WIDTH_KEY = 'wechat-md-content-width'
const PAGE_MARGIN_KEY = 'wechat-md-page-margin'
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

const VALID_FONT_SIZES = [14, 16, 18, 20, 22]
const VALID_LINE_HEIGHTS = [1, 1.6, 2, 2.6, 3]
const VALID_PAGE_MARGINS = [12, 18, 24, 30, 36]
const VALID_PARAGRAPH_SPACINGS = [0.5, 1, 1.5, 2, 2.5]
const VALID_TEXT_INDENTS = [0, 1, 2, 3, 4]
const VALID_LETTER_SPACINGS = ['', '0.6px', '1.2px', '2px', '4px']

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

export const useSettingsStore = defineStore('settings', () => {
  const previewZoom = useStorage(PREVIEW_ZOOM_KEY, '1')
  const wechatElements = useStorage<{
    followEnabled: boolean
    followName: string
    followSlogan: string
  }>(WECHAT_ELEMENTS_KEY, {
    followEnabled: false,
    followName: '',
    followSlogan: '',
  })

  // Typography — 暖色杂志默认值
  const fontFamilyKey = useStorage<FontFamilyKey>(FONT_FAMILY_KEY, MAGAZINE_DEFAULTS.fontFamilyKey)
  const fontSize = useStorage(FONT_SIZE_KEY, MAGAZINE_DEFAULTS.fontSize)
  const lineHeight = useStorage(LINE_HEIGHT_KEY, MAGAZINE_DEFAULTS.lineHeight)
  const contentWidth = useStorage(CONTENT_WIDTH_KEY, MAGAZINE_DEFAULTS.contentWidth)
  const pageMargin = useStorage(PAGE_MARGIN_KEY, MAGAZINE_DEFAULTS.pageMargin)

  // Colors
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

  if (!VALID_FONT_SIZES.includes(Number(fontSize.value))) fontSize.value = MAGAZINE_DEFAULTS.fontSize
  if (!VALID_LINE_HEIGHTS.includes(Number(lineHeight.value))) {
    lineHeight.value = MAGAZINE_DEFAULTS.lineHeight
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

  const previewZoomComputed = computed({
    get: () => previewZoom.value,
    set: (v) => {
      previewZoom.value = v
    },
  })

  const updateWechatElements = (patch: Partial<typeof wechatElements.value>) => {
    wechatElements.value = { ...wechatElements.value, ...patch }
  }

  const rememberColor = (color: string) => {
    const normalized = color.trim()
    if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return
    colorHistory.value = [
      normalized.toLowerCase(),
      ...colorHistory.value.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
    ].slice(0, 6)
  }

  return {
    previewZoom: previewZoomComputed,
    wechatElements: computed(() => wechatElements.value),
    updateWechatElements,
    rememberColor,
    fontFamilyKey,
    fontSize,
    lineHeight,
    contentWidth,
    pageMargin,
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
  }
})
