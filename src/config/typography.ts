import type { FontFamilyKey } from '@/types'

export const FONT_FAMILIES: Record<FontFamilyKey, { label: string; css: string }> = {
  wenkai: {
    label: '霞鹜文楷',
    css: "'LXGW WenKai', '霞鹜文楷', 'KaiTi', 'STKaiti', 'PingFang SC', 'Microsoft YaHei', serif",
  },
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
