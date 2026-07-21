import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { MAGAZINE_DEFAULTS } from '@/config/themes'
import { isFontFamilyKey } from '@/config/typography'
import type {
  BoldMode,
  FontFamilyKey,
  HeadingMode,
  QuoteMode,
  QuoteMode2,
  H1Mode,
  UnderlineMode,
  DesignThemeKey,
  CoverVariant,
  SectionVariant,
  QuoteVariant,
  ListVariant,
  TableVariant,
  TocMode,
  EndMarkMode,
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
const COMPONENT_COVER_KEY = 'wechat-md-component-cover'
const COMPONENT_SECTION_KEY = 'wechat-md-component-section'
const COMPONENT_QUOTE_KEY = 'wechat-md-component-quote'
const COMPONENT_UNORDERED_LIST_KEY = 'wechat-md-component-unordered-list'
const COMPONENT_ORDERED_LIST_KEY = 'wechat-md-component-ordered-list'
const COMPONENT_TABLE_KEY = 'wechat-md-component-table'
const COMPONENT_TOC_KEY = 'wechat-md-component-toc'
const COMPONENT_END_MARK_KEY = 'wechat-md-component-end-mark'
const COMPONENT_END_MARK_TEXT_KEY = 'wechat-md-component-end-mark-text'

const VALID_FONT_SIZES = [12, 14, 16, 18, 20]
const VALID_LINE_HEIGHTS = [1, 1.6, 2, 2.6, 3]
const VALID_PAGE_MARGINS = [12, 20, 28, 34, 36]
const VALID_PARAGRAPH_SPACINGS = [0.5, 1, 1.5, 2, 2.5]
const VALID_TEXT_INDENTS = [0, 1, 2, 3, 4]
const VALID_LETTER_SPACINGS = ['', '0.6px', '1.2px', '2px', '4px']

export type ColorPresetKind = 'text' | 'accent' | 'background'

export const DEFAULT_COLOR_PRESETS: Record<ColorPresetKind, string[]> = {
  text: ['#18181b', '#27272a', '#334155', '#1f2937', '#3f3a33', '#20251f', '#24352b', '#0f172a'],
  accent: ['#789262', '#057748', '#20a162', '#9d2933', '#2563eb', '#0f766e', '#c2410c', '#b42318'],
  background: [
    '#ffffff',
    '#fafafa',
    '#fffbf0',
    '#f5f8ef',
    '#d6ecf0',
    '#fff7ed',
    '#f8f5f0',
    '#f5fbf8',
  ],
}

export type StylePresetKey = DesignThemeKey

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
    description: '温润锈红与河青，留白舒展，适合叙事随笔和慢节奏长文。',
    color: '#a94f32',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#28241f',
      mutedColor: '#746b60',
      borderColor: '#e6ded3',
      bgSoftColor: '#f3eee7',
      quoteBgColor: '#f0e9df',
      accentColor: '#a94f32',
      h1Mode: 'center',
      h2Mode: 'plain',
      h3Mode: 'bar',
      h4Mode: 'plain',
      quoteMode: 'soft',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#28241f',
      h2Color: '#28241f',
      h3Color: '#2f6258',
      h4Color: '#746b60',
      headingAccent: '#a94f32',
      quoteAccent: '#2f6258',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#a94f32',
      boldMode: 'default',
      underlineColor: '#2f6258',
      underlineMode: 'solid',
      canvasColor: '#fffdf9',
    },
  },
  {
    key: 'zhujian',
    label: '朱简',
    description: '朱砂题眼与灰墨正文，层级利落，适合心理、人文和关系议题。',
    color: '#9d2f2f',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 2,
      pageMargin: 12,
      textColor: '#292729',
      mutedColor: '#777174',
      borderColor: '#e7e1df',
      bgSoftColor: '#f7f3f2',
      quoteBgColor: '#fbf4f1',
      accentColor: '#9d2f2f',
      h1Mode: 'plain',
      h2Mode: 'chip',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'panel',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: true,
      h1Color: '#292729',
      h2Color: '#7d3034',
      h3Color: '#292729',
      h4Color: '#777174',
      headingAccent: '#9d2f2f',
      quoteAccent: '#6f3f46',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#7d3034',
      boldMode: 'color',
      underlineColor: '#9d2f2f',
      underlineMode: 'solid',
      canvasColor: '#ffffff',
    },
  },
  {
    key: 'songyan',
    label: '松烟',
    description: '炭黑骨架与灰绿层次，克制清醒，适合观点文章和分析报告。',
    color: '#33443d',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#161a19',
      mutedColor: '#646b68',
      borderColor: '#d9dedb',
      bgSoftColor: '#eef1ef',
      quoteBgColor: '#edf0ee',
      accentColor: '#33443d',
      h1Mode: 'underline',
      h2Mode: 'plain',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'bar',
      quoteMode2: 'bar',
      textIndent: 0,
      textJustify: true,
      h1Color: '#161a19',
      h2Color: '#161a19',
      h3Color: '#33443d',
      h4Color: '#646b68',
      headingAccent: '#33443d',
      quoteAccent: '#52635c',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#161a19',
      boldMode: 'color',
      underlineColor: '#33443d',
      underlineMode: 'solid',
      canvasColor: '#fdfefd',
    },
  },
  {
    key: 'yuebai',
    label: '月白',
    description: '月白纸面与青灰索引，信息清晰，适合解释文章和知识密集稿件。',
    color: '#416d78',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#1d2930',
      mutedColor: '#657681',
      borderColor: '#d6e1e5',
      bgSoftColor: '#eef4f5',
      quoteBgColor: '#edf5f7',
      accentColor: '#416d78',
      h1Mode: 'dash',
      h2Mode: 'bar',
      h3Mode: 'dash',
      h4Mode: 'plain',
      quoteMode: 'outline',
      quoteMode2: 'panel',
      textIndent: 0,
      textJustify: false,
      h1Color: '#1d2930',
      h2Color: '#284e59',
      h3Color: '#284e59',
      h4Color: '#657681',
      headingAccent: '#416d78',
      quoteAccent: '#416d78',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#284e59',
      boldMode: 'underline',
      underlineColor: '#416d78',
      underlineMode: 'double',
      canvasColor: '#fbfdfd',
    },
  },
  {
    key: 'qingdai',
    label: '青黛',
    description: '青黛主笔与陶红点睛，轻盈自然，适合生活观察和说明文章。',
    color: '#2d6a58',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#1c2b27',
      mutedColor: '#65736d',
      borderColor: '#d6e1dc',
      bgSoftColor: '#edf4ef',
      quoteBgColor: '#eaf2ed',
      accentColor: '#2d6a58',
      h1Mode: 'marker',
      h2Mode: 'bar',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'note',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#1c2b27',
      h2Color: '#1c2b27',
      h3Color: '#365b4f',
      h4Color: '#65736d',
      headingAccent: '#2d6a58',
      quoteAccent: '#9a563d',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#2d6a58',
      boldMode: 'marker',
      underlineColor: '#9a563d',
      underlineMode: 'dashed',
      canvasColor: '#fbfdfb',
    },
  },
  {
    key: 'zhuzhi',
    label: '竹青纸本',
    description: '竹青定锚与胭脂钤印，纸本气息浓，适合研究札记和沉静长文。',
    color: '#56734f',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 2,
      pageMargin: 28,
      textColor: '#202823',
      mutedColor: '#657067',
      borderColor: '#d7ddd6',
      bgSoftColor: '#f0f3ed',
      quoteBgColor: '#edf2eb',
      accentColor: '#56734f',
      h1Mode: 'center',
      h2Mode: 'bar',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'soft',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#202823',
      h2Color: '#295c4c',
      h3Color: '#3f6258',
      h4Color: '#657067',
      headingAccent: '#295c4c',
      quoteAccent: '#a14d3e',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#295c4c',
      boldMode: 'color',
      underlineColor: '#a14d3e',
      underlineMode: 'marker',
      canvasColor: '#fffdf8',
    },
  },
  {
    key: 'haitang',
    label: '海棠',
    description: '海棠胭脂与灰粉留白，柔和细腻，适合人物、审美和情绪表达。',
    color: '#a5405b',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#36272d',
      mutedColor: '#806e75',
      borderColor: '#eadde1',
      bgSoftColor: '#f8f0f2',
      quoteBgColor: '#f6edef',
      accentColor: '#a5405b',
      h1Mode: 'center',
      h2Mode: 'chip',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'soft',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: false,
      h1Color: '#36272d',
      h2Color: '#7b3047',
      h3Color: '#5f3b46',
      h4Color: '#806e75',
      headingAccent: '#a5405b',
      quoteAccent: '#a5405b',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#7b3047',
      boldMode: 'color',
      underlineColor: '#a5405b',
      underlineMode: 'marker',
      canvasColor: '#fffdfd',
    },
  },
  {
    key: 'shupian',
    label: '薯片纸袋',
    description: '纸袋橙与茶青题眼，松弛有锋芒，适合文化观察和评论文章。',
    color: '#b76524',
    settings: {
      fontFamilyKey: 'serif',
      lineHeight: 2,
      pageMargin: 28,
      textColor: '#25251f',
      mutedColor: '#706e62',
      borderColor: '#ded9ca',
      bgSoftColor: '#f4f0e3',
      quoteBgColor: '#f8f1df',
      accentColor: '#b76524',
      h1Mode: 'plain',
      h2Mode: 'bar',
      h3Mode: 'plain',
      h4Mode: 'plain',
      quoteMode: 'bar',
      quoteMode2: 'fade',
      textIndent: 0,
      textJustify: true,
      h1Color: '#25251f',
      h2Color: '#2d675c',
      h3Color: '#25251f',
      h4Color: '#706e62',
      headingAccent: '#2d675c',
      quoteAccent: '#b76524',
      letterSpacing: '',
      paragraphSpacing: 1,
      boldColor: '#2d675c',
      boldMode: 'color',
      underlineColor: '#c8952f',
      underlineMode: 'marker',
      canvasColor: '#fffdf7',
    },
  },
  {
    key: 'liujin',
    label: '流金',
    description: '古金强调与深褐收束，重点醒目，适合教程、清单和轻商业内容。',
    color: '#936b1f',
    settings: {
      fontFamilyKey: 'sans',
      lineHeight: 1.6,
      pageMargin: 20,
      textColor: '#2c291f',
      mutedColor: '#756e5d',
      borderColor: '#e2dccb',
      bgSoftColor: '#f6f2e6',
      quoteBgColor: '#f7eed8',
      accentColor: '#936b1f',
      h1Mode: 'panel',
      h2Mode: 'chip',
      h3Mode: 'marker',
      h4Mode: 'plain',
      quoteMode: 'note',
      quoteMode2: 'panel',
      textIndent: 0,
      textJustify: false,
      h1Color: '#2c291f',
      h2Color: '#5b4b2c',
      h3Color: '#6b5423',
      h4Color: '#756e5d',
      headingAccent: '#936b1f',
      quoteAccent: '#936b1f',
      letterSpacing: '',
      paragraphSpacing: 1.5,
      boldColor: '#6b5423',
      boldMode: 'marker',
      underlineColor: '#936b1f',
      underlineMode: 'marker',
      canvasColor: '#fffdf8',
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
  const activeStylePreset = useStorage<StylePresetKey | ''>(STYLE_PRESET_KEY, 'qiuhe')
  const componentCover = useStorage<CoverVariant | ''>(COMPONENT_COVER_KEY, '')
  const componentSection = useStorage<SectionVariant | ''>(COMPONENT_SECTION_KEY, '')
  const componentQuote = useStorage<QuoteVariant | ''>(COMPONENT_QUOTE_KEY, '')
  const componentUnorderedList = useStorage<ListVariant | ''>(COMPONENT_UNORDERED_LIST_KEY, '')
  const componentOrderedList = useStorage<ListVariant | ''>(COMPONENT_ORDERED_LIST_KEY, '')
  const componentTable = useStorage<TableVariant | ''>(COMPONENT_TABLE_KEY, '')
  const componentTocMode = useStorage<TocMode>(COMPONENT_TOC_KEY, 'theme')
  const componentEndMarkMode = useStorage<EndMarkMode>(COMPONENT_END_MARK_KEY, 'theme')
  const componentEndMarkText = useStorage(COMPONENT_END_MARK_TEXT_KEY, '')
  const colorPresets = useStorage<Record<ColorPresetKind, string[]>>(
    COLOR_PRESETS_KEY,
    DEFAULT_COLOR_PRESETS,
  )

  if (!activeStylePreset.value) activeStylePreset.value = 'qiuhe'

  // Older builds exposed a WebFont that cannot survive WeChat paste output.
  if (!isFontFamilyKey(fontFamilyKey.value)) {
    fontFamilyKey.value = MAGAZINE_DEFAULTS.fontFamilyKey
  }

  if (!VALID_FONT_SIZES.includes(Number(fontSize.value)))
    fontSize.value = MAGAZINE_DEFAULTS.fontSize
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
    background: normalizePresetList(
      colorPresets.value.background,
      DEFAULT_COLOR_PRESETS.background,
    ),
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
    componentCover.value = ''
    componentSection.value = ''
    componentQuote.value = ''
    componentUnorderedList.value = ''
    componentOrderedList.value = ''
    componentTable.value = ''
    componentTocMode.value = 'theme'
    componentEndMarkMode.value = 'theme'
    componentEndMarkText.value = ''
  }

  const resetComponentOverrides = () => {
    componentCover.value = ''
    componentSection.value = ''
    componentQuote.value = ''
    componentUnorderedList.value = ''
    componentOrderedList.value = ''
    componentTable.value = ''
    componentTocMode.value = 'theme'
    componentEndMarkMode.value = 'theme'
    componentEndMarkText.value = ''
  }

  return {
    previewZoom: previewZoomComputed,
    rememberColor,
    updateColorPreset,
    applyStylePreset,
    resetComponentOverrides,
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
    componentCover,
    componentSection,
    componentQuote,
    componentUnorderedList,
    componentOrderedList,
    componentTable,
    componentTocMode,
    componentEndMarkMode,
    componentEndMarkText,
  }
})

function normalizeHexColor(color: string) {
  const normalized = color.trim().toLowerCase()
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : ''
}

function normalizePresetList(value: string[] | undefined, fallback: string[]) {
  const source = Array.isArray(value) ? value : []
  return fallback.map(
    (fallbackColor, index) => normalizeHexColor(source[index] || '') || fallbackColor,
  )
}
