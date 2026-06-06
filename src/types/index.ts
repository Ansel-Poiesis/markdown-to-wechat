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
  quoteMode: string
  fontSize?: number
  lineHeight?: number
  width?: number
}

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
  type?: 'localImage' | 'emptyLink' | 'unclosedCode' | 'multiH1' | 'deepHeading' | 'externalLink' | 'manyTables' | 'longLine' | 'longCode' | 'fewHeadings' | 'noHeading'
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
