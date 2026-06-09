import type { Theme, CodeTheme } from '@/types'

// 暖色杂志 — 唯一主题
const MAGAZINE_THEME: Theme = {
  name: '暖色杂志',
  description: '温和有层次，适合叙事和访谈。',
  base: {
    fontFamily: "'Songti SC', 'STSong', 'Noto Serif CJK SC', 'SimSun', serif",
    color: '#332b24',
    accent: '#b14f2a',
    muted: '#806f61',
    border: '#ead8c7',
    bgSoft: '#fff6ee',
    quoteBg: '#fff3e9',
    h1Mode: 'center',
    headingMode: 'plain',
    h2Mode: 'plain',
    h3Mode: 'bar',
    h4Mode: 'plain',
    quoteMode: 'soft',
    quoteMode2: 'fade',
  },
}

export const themes: Record<string, Theme> = {
  magazine: MAGAZINE_THEME,
}

export const codeThemes: Record<string, CodeTheme> = {
  light: {
    name: '浅色',
    background: '#f6f8fa',
    color: '#1f2328',
    border: '#d0d7de',
    keyword: '#6f42c1',
    string: '#0d7a56',
    comment: '#7a8490',
    number: '#cf222e',
  },
  dark: {
    name: '深色',
    background: '#1e1e2e',
    color: '#cdd6f4',
    border: '#2a2a3c',
    keyword: '#cba6f7',
    string: '#a6e3a1',
    comment: '#6c7086',
    number: '#fab387',
  },
  paper: {
    name: '纸张',
    background: '#faf6ed',
    color: '#4a3828',
    border: '#e6d5c3',
    keyword: '#92400e',
    string: '#3f6212',
    comment: '#8c7b6b',
    number: '#b45309',
  },
}

export const THEME_KEY = 'wechat-md-theme'
export const CODE_THEME_KEY = 'wechat-md-code-theme'

// 杂志主题的默认设置值（用于 settings store 初始化）
export const MAGAZINE_DEFAULTS = {
  fontFamilyKey: 'serif' as const,
  fontSize: 16,
  lineHeight: 1.6,
  contentWidth: 440,
  pageMargin: 20,
  textColor: '#332b24',
  mutedColor: '#806f61',
  borderColor: '#ead8c7',
  bgSoftColor: '#fff6ee',
  quoteBgColor: '#fff3e9',
  accentColor: '#b14f2a',
  h1Mode: 'center' as const,
  headingMode: 'plain' as const,
  h2Mode: 'plain' as const,
  h3Mode: 'bar' as const,
  h4Mode: 'plain' as const,
  quoteMode: 'soft' as const,
  quoteMode2: 'fade' as const,
  textIndent: 0,
  textJustify: false,
  macCodeBlock: true,
  codeLineNumbers: false,
  h1Color: '',
  h2Color: '',
  h3Color: '',
  h4Color: '',
  headingAccent: '',
  quoteAccent: '',
  letterSpacing: '',
  paragraphSpacing: 1,
  boldColor: '',
  boldMode: 'default' as const,
  underlineColor: '',
  underlineMode: 'solid' as const,
  canvasColor: '#ffffff',
}
