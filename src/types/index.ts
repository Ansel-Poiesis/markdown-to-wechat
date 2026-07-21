export interface ThemeBase {
  fontFamily: string
  color: string
  accent: string
  muted: string
  border: string
  bgSoft: string
  quoteBg: string
  canvas?: string
  h1Mode: string
  headingMode: string
  h2Mode?: string
  h3Mode?: string
  h4Mode?: string
  quoteMode: string
  quoteMode2: string
  fontSize?: number
  lineHeight?: number
  width?: number
  /** 页面左右留白，控制复制到公众号后的文章内边距 */
  pageMargin?: number
  textIndent?: boolean | number
  textJustify?: boolean
  macCodeBlock?: boolean
  codeLineNumbers?: boolean
  /** H1 标题文字颜色 */
  h1Color?: string
  /** H2 标题文字颜色 */
  h2Color?: string
  /** H3 标题文字颜色 */
  h3Color?: string
  /** H4 标题文字颜色 */
  h4Color?: string
  /** 标题装饰色 — 独立于强调色，控制标题分割线/左边线/色块 */
  headingAccent?: string
  /** 引用边线色 — 独立于强调色，控制引用左侧竖线 */
  quoteAccent?: string
  /** 字间距（如 "0.5px"） */
  letterSpacing?: string
  /** 段落间距倍数（1.0 = 默认） */
  paragraphSpacing?: number
  /** 加粗文字颜色 */
  boldColor?: string
  /** 加粗文字样式 */
  boldMode?: string
  /** 正文分割线颜色 */
  underlineColor?: string
  /** 正文分割线样式 */
  underlineMode?: string
  /** 当前文章使用的组件化设计主题。 */
  designKey?: DesignThemeKey
  /** 独立于主题的组件样式覆盖。空值表示跟随主题。 */
  componentOverrides?: ComponentStyleOverrides
}

export type DesignThemeKey =
  | 'qiuhe'
  | 'zhujian'
  | 'songyan'
  | 'yuebai'
  | 'qingdai'
  | 'zhuzhi'
  | 'haitang'
  | 'shupian'
  | 'liujin'

export type CoverVariant =
  | 'editorial'
  | 'cinnabar'
  | 'minimal'
  | 'index'
  | 'botanical'
  | 'paper'
  | 'soft'
  | 'ticket'
  | 'guide'
export type SectionVariant = 'numbered' | 'rule' | 'label' | 'marker' | 'stamp'
export type QuoteVariant = 'pull' | 'panel' | 'bar' | 'note' | 'outline'
export type ListVariant = 'plain' | 'cards' | 'steps' | 'ledger'
export type TableVariant = 'grid' | 'striped' | 'ledger'
export type TocMode = 'theme' | 'show' | 'hide'
export type EndMarkMode = 'theme' | 'show' | 'hide'

export interface ComponentStyleOverrides {
  cover?: CoverVariant
  section?: SectionVariant
  quote?: QuoteVariant
  unorderedList?: ListVariant
  orderedList?: ListVariant
  table?: TableVariant
  tocMode?: TocMode
  endMarkMode?: EndMarkMode
  endMarkText?: string
}

export interface ArticleHeading {
  level: number
  text: string
  sectionIndex?: number
}

export interface ArticleDocument {
  title: string
  headings: ArticleHeading[]
  sectionCount: number
  hasCode: boolean
  hasImages: boolean
  hasTables: boolean
}

export type FontFamilyKey = 'wenkai' | 'sans' | 'serif' | 'mono'
export type HeadingMode = 'bar' | 'chip' | 'plain' | 'marker' | 'dash'
export type QuoteMode = 'bar' | 'panel' | 'soft' | 'outline' | 'note'
export type QuoteMode2 = 'bar' | 'panel' | 'fade'
export type H1Mode = 'underline' | 'center' | 'panel' | 'plain' | 'marker' | 'dash'
export type UnderlineMode = 'solid' | 'dashed' | 'wavy' | 'double' | 'marker'
export type BoldMode = 'default' | 'color' | 'marker' | 'underline'

export interface Theme {
  name: string
  description: string
  base: ThemeBase
}

export interface CodeTheme {
  name: string
  background: string
  color: string
  border: string
  keyword: string
  string: string
  comment: string
  number: string
}

export interface CustomThemeSettings {
  accent: string
  fontSize: number
  lineHeight: number
  width: number
  h1Mode: string
  headingMode: string
  quoteMode: string
  fontFamily: string
}

export interface ImageSettings {
  width: string
  radius: number
  caption: boolean
}

export interface Draft {
  id: number
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Template {
  name: string
  category?: string
  content: string
}

export interface WarningItem {
  level: 'danger' | 'warn' | 'info' | 'ok'
  text: string
  type?:
    | 'localImage'
    | 'embeddedImage'
    | 'emptyLink'
    | 'unclosedCode'
    | 'multiH1'
    | 'deepHeading'
    | 'externalLink'
    | 'manyTables'
    | 'longLine'
    | 'longCode'
    | 'fewHeadings'
    | 'noHeading'
    | 'htmlCompatibility'
}

export interface MarkdownStats {
  wordCount: number
  readingMinutes: number
  headings: number
  images: number
  links: number
  codeBlocks: number
  tableRows: number
  paragraphs: number
}

export interface PreflightCounts {
  danger: number
  warn: number
  info: number
}

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}
