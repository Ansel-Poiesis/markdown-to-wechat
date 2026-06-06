import type { Theme, CodeTheme, CustomThemeSettings } from '@/types'

const defaultLightBase = {
  color: '#2f3033',
  muted: '#7d858c',
  border: '#e7e7e7',
  bgSoft: '#f7fbf8',
  quoteBg: '#f5f7f6',
}

export const themes: Record<string, Theme> = {
  classic: {
    name: '经典微信',
    description: '稳妥通用，适合大多数公众号正文。',
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      ...defaultLightBase,
      accent: '#07c160',
      h1Mode: 'underline',
      headingMode: 'bar',
      quoteMode: 'bar',
    },
  },
  minimal: {
    name: '极简阅读',
    description: '留白克制，适合观点和长文。',
    base: {
      fontFamily:
        "'Optima', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#252525',
      accent: '#111111',
      muted: '#777777',
      border: '#e5e2dc',
      bgSoft: '#faf9f6',
      quoteBg: '#f4f2ed',
      h1Mode: 'plain',
      headingMode: 'plain',
      quoteMode: 'soft',
    },
  },
  tech: {
    name: '技术博客',
    description: '清晰理性，代码和表格更突出。',
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: '#263238',
      accent: '#006d77',
      muted: '#5f6b70',
      border: '#c9dadd',
      bgSoft: '#eef8f8',
      quoteBg: '#edf6f7',
      h1Mode: 'panel',
      headingMode: 'chip',
      quoteMode: 'panel',
    },
  },
  business: {
    name: '商务蓝',
    description: '专业干净，适合报告和方案。',
    base: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      color: '#243042',
      accent: '#2468a2',
      muted: '#637083',
      border: '#d4e0ea',
      bgSoft: '#f0f6fb',
      quoteBg: '#eef5fb',
      h1Mode: 'underline',
      headingMode: 'bar',
      quoteMode: 'soft',
    },
  },
  magazine: {
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
      quoteMode: 'soft',
    },
  },
  night: {
    name: '夜读深灰',
    description: '深色沉浸，适合夜读和专题。',
    base: {
      fontFamily:
        "'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif",
      color: '#e8ecef',
      accent: '#8ab4a6',
      muted: '#b5bec5',
      border: '#3b454c',
      bgSoft: '#273038',
      quoteBg: '#2b343b',
      canvas: '#1f262c',
      h1Mode: 'underline',
      headingMode: 'chip',
      quoteMode: 'panel',
    },
  },
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

export const CUSTOM_THEME_KEY = 'wechat-md-custom-theme'
export const THEME_KEY = 'wechat-md-theme'
export const CODE_THEME_KEY = 'wechat-md-code-theme'
export const LAST_LIGHT_THEME_KEY = 'wechat-md-last-light-theme'

export function getCustomThemeSettings(): CustomThemeSettings {
  const fallback: CustomThemeSettings = {
    accent: '#07c160',
    fontSize: 16,
    lineHeight: 1.8,
    width: 420,
    h1Mode: 'underline',
    headingMode: 'bar',
    quoteMode: 'bar',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  }
  try {
    const stored = localStorage.getItem(CUSTOM_THEME_KEY)
    if (stored) return { ...fallback, ...JSON.parse(stored) }
    return fallback
  } catch {
    return fallback
  }
}

export function applyCustomThemeSettings(): Theme {
  const custom = getCustomThemeSettings()
  return {
    name: '我的主题',
    description: '根据你的配色、字号和行宽保存。',
    base: {
      fontFamily: custom.fontFamily,
      ...defaultLightBase,
      accent: custom.accent,
      h1Mode: custom.h1Mode,
      headingMode: custom.headingMode,
      quoteMode: custom.quoteMode,
      fontSize: Number(custom.fontSize),
      lineHeight: Number(custom.lineHeight),
      width: Number(custom.width),
    },
  }
}
