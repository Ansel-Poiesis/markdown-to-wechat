import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { themes, codeThemes, applyCustomThemeSettings, THEME_KEY, CODE_THEME_KEY, LAST_LIGHT_THEME_KEY } from '@/config/themes'
import type { Theme, CodeTheme } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const storedTheme = useStorage(THEME_KEY, 'classic')
  const storedCodeTheme = useStorage(CODE_THEME_KEY, 'light')
  const lastLightTheme = useStorage(LAST_LIGHT_THEME_KEY, 'classic')

  const currentThemeKey = computed({
    get: () => {
      const key = storedTheme.value
      return (themes[key] || key === 'custom') ? key : 'classic'
    },
    set: (key: string) => {
      if (key !== 'night') {
        lastLightTheme.value = key
      }
      storedTheme.value = key
    },
  })

  const currentCodeThemeKey = computed({
    get: () => (codeThemes[storedCodeTheme.value] ? storedCodeTheme.value : 'light'),
    set: (key: string) => {
      storedCodeTheme.value = key
    },
  })

  const customTheme = ref<Theme>(applyCustomThemeSettings())

  const allThemes = computed(() => {
    const result: Record<string, Theme> = { ...themes }
    result.custom = customTheme.value
    return result
  })

  const currentTheme = computed(() => (allThemes.value[currentThemeKey.value] || allThemes.value.classic) as Theme)
  const currentCodeTheme = computed(() => (codeThemes[currentCodeThemeKey.value] || codeThemes.light) as CodeTheme)
  const themeBase = computed(() => currentTheme.value.base)

  const setCustomTheme = (settings: Partial<Theme['base']>) => {
    const baseTheme = themes[lastLightTheme.value]?.base ?? (themes.classic as Theme).base
    customTheme.value = {
      name: '我的主题',
      description: '根据你的配色、字号和行宽保存。',
      base: { ...baseTheme, ...settings },
    }
    try {
      localStorage.setItem('wechat-md-custom-theme', JSON.stringify({
        accent: settings.accent,
        fontSize: settings.fontSize,
        lineHeight: settings.lineHeight,
        width: settings.width,
        h1Mode: settings.h1Mode,
        headingMode: settings.headingMode,
        quoteMode: settings.quoteMode,
        fontFamily: settings.fontFamily,
      }))
    } catch { /* ignore */ }
  }

  const resetCustomTheme = () => {
    customTheme.value = applyCustomThemeSettings()
  }

  return {
    currentThemeKey,
    currentCodeThemeKey,
    currentTheme,
    currentCodeTheme,
    themeBase,
    customTheme,
    allThemes,
    setCustomTheme,
    resetCustomTheme,
  }
})
