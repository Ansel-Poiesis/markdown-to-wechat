import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { themes, codeThemes, THEME_KEY, CODE_THEME_KEY } from '@/config/themes'
import { useSettingsStore, FONT_FAMILIES } from '@/stores/settings'
import type { Theme, CodeTheme, ThemeBase } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const storedCodeTheme = useStorage(CODE_THEME_KEY, 'paper')

  // 固定使用杂志主题
  const currentThemeKey = 'magazine'
  const currentTheme = computed(() => themes.magazine as Theme)

  const currentCodeThemeKey = computed({
    get: () => (codeThemes[storedCodeTheme.value] ? storedCodeTheme.value : 'paper'),
    set: (key: string) => {
      storedCodeTheme.value = key
    },
  })

  const currentCodeTheme = computed(
    () => (codeThemes[currentCodeThemeKey.value] || codeThemes.paper) as CodeTheme,
  )

  // 主题基础色 + 用户排版设置合并
  const themeBase = computed<ThemeBase>(() => {
    const base = currentTheme.value.base
    const settings = useSettingsStore()
    const fontFamily = FONT_FAMILIES[settings.fontFamilyKey]?.css ?? base.fontFamily
    return {
      ...base,
      fontFamily,
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      width: settings.contentWidth,
      pageMargin: settings.pageMargin,
      accent: settings.accentColor || base.accent,
      h1Mode: settings.h1Mode,
      headingMode: settings.headingMode,
      h2Mode: settings.h2Mode || settings.headingMode,
      h3Mode: settings.h3Mode || settings.headingMode,
      h4Mode: settings.h4Mode || settings.headingMode,
      quoteMode: settings.quoteMode,
      quoteMode2: settings.quoteMode2,
      textIndent: settings.textIndent,
      textJustify: settings.textJustify,
      macCodeBlock: settings.macCodeBlock,
      codeLineNumbers: settings.codeLineNumbers,
      h1Color: settings.h1Color || undefined,
      h2Color: settings.h2Color || undefined,
      h3Color: settings.h3Color || undefined,
      h4Color: settings.h4Color || undefined,
      headingAccent: settings.underlineColor || undefined,
      quoteAccent: settings.quoteAccent || undefined,
      letterSpacing: settings.letterSpacing || undefined,
      paragraphSpacing: settings.paragraphSpacing || undefined,
      boldColor: settings.boldColor || undefined,
      boldMode: settings.boldMode || undefined,
      underlineColor: settings.underlineColor || undefined,
      underlineMode: settings.underlineMode || undefined,
      canvas: settings.canvasColor || undefined,
    }
  })

  return {
    currentThemeKey,
    currentCodeThemeKey,
    currentTheme,
    currentCodeTheme,
    themeBase,
  }
})
