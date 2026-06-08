<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore, FONT_FAMILIES } from '@/stores/settings'
import { codeThemes } from '@/config/themes'
import type { BoldMode, FontFamilyKey, UnderlineMode } from '@/types'
import AppIcon from '@/components/ui/AppIcon.vue'
import DraftPanel from '@/components/DraftPanel.vue'

type IconName = InstanceType<typeof AppIcon>['$props']['name']
type SettingsTab = 'body' | 'components' | 'drafts'
type ComponentSection =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'quote'
  | 'underline'
  | 'bold'
  | 'code'
  | 'background'
  | 'wechat'

const themeStore = useThemeStore()
const settings = useSettingsStore()

const activeTab = ref<SettingsTab>('body')
const openSections = ref<Record<ComponentSection, boolean>>({
  background: true,
  h1: false,
  h2: false,
  h3: false,
  h4: false,
  quote: false,
  underline: false,
  bold: false,
  code: false,
  wechat: false,
})

const tabs: Array<{ key: SettingsTab; label: string; icon: IconName }> = [
  { key: 'body', label: '正文样式', icon: 'palette' },
  { key: 'components', label: '组件', icon: 'fileText' },
  { key: 'drafts', label: '草稿', icon: 'draft' },
]

const codeThemeOptions = computed(() =>
  Object.entries(codeThemes).map(([key, t]) => ({ key, label: t.name })),
)

const zoomOptions = [
  { label: '75%', value: '0.75' },
  { label: '100%', value: '1' },
  { label: '125%', value: '1.25' },
]

const fontFamilyOptions = (
  Object.entries(FONT_FAMILIES) as [FontFamilyKey, (typeof FONT_FAMILIES)['sans']][]
).map(([key, v]) => ({ key, label: v.label }))

const fontSizeOptions = [14, 16, 18, 20, 22]
const lineHeightOptions = [1, 1.6, 2, 2.6, 3]
const pageMarginOptions = [12, 18, 24, 30, 36]
const paragraphSpacingOptions = [
  { label: '0.5', value: 0.5 },
  { label: '1.0', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2.0', value: 2 },
  { label: '2.5', value: 2.5 },
]
const letterSpacingOptions = [
  { label: '无', value: '' },
  { label: '0.6', value: '0.6px' },
  { label: '1.2', value: '1.2px' },
  { label: '2', value: '2px' },
  { label: '4', value: '4px' },
]
const textIndentOptions = [
  { label: '无', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
]

const h1ModeOptions = [
  { key: 'underline', label: '分割线' },
  { key: 'center', label: '居中' },
  { key: 'panel', label: '面板' },
  { key: 'marker', label: '荧光' },
  { key: 'dash', label: '虚线' },
  { key: 'plain', label: '纯净' },
]

const headingModeOptions = [
  { key: 'bar', label: '左边线' },
  { key: 'chip', label: '色块' },
  { key: 'plain', label: '分割线' },
  { key: 'marker', label: '荧光' },
  { key: 'dash', label: '虚线' },
]

const quoteModeOptions = [
  { key: 'bar', label: '左边线' },
  { key: 'panel', label: '卡片' },
  { key: 'soft', label: '柔光' },
  { key: 'outline', label: '虚线框' },
  { key: 'note', label: '笔记' },
]

const quoteMode2Options = [
  { key: 'bar', label: '虚线' },
  { key: 'panel', label: '边框' },
  { key: 'fade', label: '淡化' },
]

const ACCENT_PRESETS = [
  { label: '陶土', color: '#b14f2a' },
  { label: '酒红', color: '#8b3a4a' },
  { label: '墨绿', color: '#3a6b52' },
  { label: '藏蓝', color: '#3a5a8b' },
]

const BG_PRESETS = [
  { label: '纯白', color: '#ffffff' },
  { label: '暖白', color: '#fefcf9' },
  { label: '米色', color: '#faf6ed' },
  { label: '浅灰', color: '#f6f6f6' },
]

const TEXT_COLOR_PRESETS = [
  { label: '墨色', color: '#332b24' },
  { label: '炭黑', color: '#18181b' },
  { label: '灰褐', color: '#5f554d' },
  { label: '深蓝', color: '#24364f' },
]

const underlineModeOptions: Array<{ key: UnderlineMode; label: string }> = [
  { key: 'solid', label: '实线' },
  { key: 'dashed', label: '虚线' },
  { key: 'wavy', label: '波浪' },
  { key: 'double', label: '双线' },
  { key: 'marker', label: '荧光' },
]

const boldModeOptions: Array<{ key: BoldMode; label: string }> = [
  { key: 'default', label: '默认' },
  { key: 'color', label: '着色' },
  { key: 'marker', label: '荧光' },
  { key: 'underline', label: '底线' },
]

const typographySummary = computed(() => {
  const family = FONT_FAMILIES[settings.fontFamilyKey]?.label ?? '字体'
  return `${family} · ${settings.fontSize}px · ${settings.lineHeight.toFixed(1)}`
})

function optionLabel(options: Array<{ key: string; label: string }>, key: string) {
  return options.find((opt) => opt.key === key)?.label || '默认'
}

function formatLineHeight(value: number) {
  if (value === 1 || value === 3) return String(value)
  return value.toFixed(1)
}

function toggleSection(section: ComponentSection) {
  openSections.value = {
    ...openSections.value,
    [section]: !openSections.value[section],
  }
}

function isOpen(section: ComponentSection) {
  return openSections.value[section]
}

function resetUnderlineColors() {
  resetColor('underlineColor')
}

const colorPickers = ref<Record<string, boolean>>({})
const historyTimers = new Map<string, ReturnType<typeof window.setTimeout>>()

function setColor(target: string, color: string) {
  ;(settings as unknown as Record<string, string>)[target] = color
  if (historyTimers.has(target)) {
    window.clearTimeout(historyTimers.get(target))
  }
  const timer = window.setTimeout(() => {
    if (colorValue(target).toLowerCase() === color.toLowerCase()) {
      settings.rememberColor(color)
    }
    historyTimers.delete(target)
  }, 3000)
  historyTimers.set(target, timer)
}

function resetColor(target: string) {
  ;(settings as unknown as Record<string, string>)[target] = ''
}

function resetCanvasColor() {
  settings.canvasColor = '#ffffff'
}

function updateCustomColor(target: string, event: Event) {
  const color = (event.target as HTMLInputElement).value
  setColor(target, color)
}

function colorValue(target: string) {
  return (settings as unknown as Record<string, string>)[target] || ''
}

const visibleColorHistory = computed(() => settings.colorHistory.slice(0, 3))

function toggleColorPicker(target: string) {
  colorPickers.value = {
    ...colorPickers.value,
    [target]: !colorPickers.value[target],
  }
}

function isColorPickerOpen(target: string) {
  return !!colorPickers.value[target]
}
</script>

<template>
  <aside
    class="flex flex-col min-h-0 rounded-2xl bg-surface overflow-hidden border border-border-subtle shadow-sm"
    aria-label="设置"
  >
    <header class="settings-header">
      <div class="flex items-center gap-3 min-w-0">
        <span class="settings-header__icon">
          <AppIcon name="settings" :size="15" />
        </span>
        <div class="min-w-0">
          <h2 class="settings-title">设置</h2>
          <p class="settings-subtitle">暖色杂志 · 微信输出</p>
        </div>
      </div>
    </header>

    <section class="preview-control" aria-label="预览缩放">
      <span class="control-label">预览</span>
      <div class="segmented segmented--compact">
        <button
          v-for="opt in zoomOptions"
          :key="opt.value"
          type="button"
          class="segmented-button"
          :class="String(settings.previewZoom) === opt.value ? 'segmented-button--active' : ''"
          @click="settings.previewZoom = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <nav class="settings-tabs" aria-label="设置分区">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="settings-tab"
        :class="activeTab === tab.key ? 'settings-tab--active' : ''"
        @click="activeTab = tab.key"
      >
        <AppIcon :name="tab.icon" :size="15" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="settings-body">
      <section v-if="activeTab === 'body'" class="section-stack">
        <div class="section-heading">
          <div>
            <h3>正文样式</h3>
            <p>{{ typographySummary }}</p>
          </div>
        </div>

        <div class="setting-group setting-group--plain">
          <div class="setting-row setting-row--inline">
            <span class="control-label">字体</span>
            <div class="segmented">
              <button
                v-for="opt in fontFamilyOptions"
                :key="opt.key"
                type="button"
                class="segmented-button"
                :class="settings.fontFamilyKey === opt.key ? 'segmented-button--active' : ''"
                @click="settings.fontFamilyKey = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">字号</span>
            <div class="segmented">
              <button
                v-for="size in fontSizeOptions"
                :key="size"
                type="button"
                class="segmented-button"
                :class="settings.fontSize === size ? 'segmented-button--active' : ''"
                @click="settings.fontSize = size"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">行高</span>
            <div class="segmented">
              <button
                v-for="height in lineHeightOptions"
                :key="height"
                type="button"
                class="segmented-button"
                :class="settings.lineHeight === height ? 'segmented-button--active' : ''"
                @click="settings.lineHeight = height"
              >
                {{ formatLineHeight(height) }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">页边距</span>
            <div class="segmented">
              <button
                v-for="margin in pageMarginOptions"
                :key="margin"
                type="button"
                class="segmented-button"
                :class="settings.pageMargin === margin ? 'segmented-button--active' : ''"
                @click="settings.pageMargin = margin"
              >
                {{ margin }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">段距</span>
            <div class="segmented">
              <button
                v-for="opt in paragraphSpacingOptions"
                :key="opt.value"
                type="button"
                class="segmented-button"
                :class="settings.paragraphSpacing === opt.value ? 'segmented-button--active' : ''"
                @click="settings.paragraphSpacing = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">字距</span>
            <div class="segmented">
              <button
                v-for="opt in letterSpacingOptions"
                :key="opt.value"
                type="button"
                class="segmented-button"
                :class="settings.letterSpacing === opt.value ? 'segmented-button--active' : ''"
                @click="settings.letterSpacing = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="setting-row setting-row--inline">
            <span class="control-label">缩进</span>
            <div class="segmented">
              <button
                v-for="opt in textIndentOptions"
                :key="opt.value"
                type="button"
                class="segmented-button"
                :class="Number(settings.textIndent) === opt.value ? 'segmented-button--active' : ''"
                @click="settings.textIndent = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="switch-grid switch-grid--single">
            <button
              type="button"
              class="switch-card"
              :class="settings.textJustify ? 'switch-card--active' : ''"
              @click="settings.textJustify = !settings.textJustify"
            >
              <span>两端对齐</span>
              <span class="switch-dot" />
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'components'" class="section-stack">
        <div class="accordion">
          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('background')">
              <span>背景色</span>
              <strong>{{ settings.canvasColor || '#ffffff' }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('background') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('background')" class="accordion-body">
              <div class="color-line">
                <button
                  v-for="preset in BG_PRESETS"
                  :key="preset.color"
                  type="button"
                  class="color-swatch color-swatch--light"
                  :class="
                    (settings.canvasColor || '#ffffff') === preset.color
                      ? 'color-swatch--active'
                      : ''
                  "
                  :title="preset.label"
                  :aria-label="preset.label"
                  :style="{ background: preset.color }"
                  @click="setColor('canvasColor', preset.color)"
                />
                <button
                  v-for="color in visibleColorHistory"
                  :key="`bg-${color}`"
                  type="button"
                  class="color-swatch color-swatch--light"
                  :class="settings.canvasColor === color ? 'color-swatch--active' : ''"
                  :style="{ background: color }"
                  :title="color"
                  :aria-label="color"
                  @click="setColor('canvasColor', color)"
                />
                <button type="button" class="custom-color-button" title="自选颜色" @click="toggleColorPicker('canvasColor')">
                  <AppIcon name="pen" :size="13" />
                </button>
                <input
                  v-if="isColorPickerOpen('canvasColor')"
                  type="color"
                  class="inline-color-input"
                  :value="settings.canvasColor || '#ffffff'"
                  @input="updateCustomColor('canvasColor', $event)"
                />
                <button type="button" class="reset-inline" @click="resetCanvasColor">
                  恢复默认
                </button>
              </div>
            </div>
          </article>
          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('h1')">
              <span>H1</span>
              <strong>{{ optionLabel(h1ModeOptions, settings.h1Mode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('h1') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('h1')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in h1ModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.h1Mode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.h1Mode = opt.key as typeof settings.h1Mode"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row color-setting-row--plain">
                <div class="color-line">
                  <button
                    v-for="preset in TEXT_COLOR_PRESETS"
                    :key="`h1-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h1Color === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('h1Color', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`h1-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h1Color === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('h1Color', color)"
                  />
                  <button
                    type="button"
                    class="custom-color-button"
                    title="自选颜色"
                    @click="toggleColorPicker('h1Color')"
                  >
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('h1Color')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.h1Color || '#332b24'"
                    @input="updateCustomColor('h1Color', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('h1Color')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('h2')">
              <span>H2</span>
              <strong>{{ optionLabel(headingModeOptions, settings.h2Mode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('h2') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('h2')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in headingModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.h2Mode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.h2Mode = opt.key as typeof settings.h2Mode"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row color-setting-row--plain">
                <div class="color-line">
                  <button
                    v-for="preset in TEXT_COLOR_PRESETS"
                    :key="`h2-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h2Color === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('h2Color', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`h2-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h2Color === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('h2Color', color)"
                  />
                  <button
                    type="button"
                    class="custom-color-button"
                    title="自选颜色"
                    @click="toggleColorPicker('h2Color')"
                  >
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('h2Color')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.h2Color || '#332b24'"
                    @input="updateCustomColor('h2Color', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('h2Color')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('h3')">
              <span>H3</span>
              <strong>{{ optionLabel(headingModeOptions, settings.h3Mode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('h3') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('h3')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in headingModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.h3Mode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.h3Mode = opt.key as typeof settings.h3Mode"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row color-setting-row--plain">
                <div class="color-line">
                  <button
                    v-for="preset in TEXT_COLOR_PRESETS"
                    :key="`h3-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h3Color === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('h3Color', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`h3-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h3Color === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('h3Color', color)"
                  />
                  <button
                    type="button"
                    class="custom-color-button"
                    title="自选颜色"
                    @click="toggleColorPicker('h3Color')"
                  >
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('h3Color')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.h3Color || '#332b24'"
                    @input="updateCustomColor('h3Color', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('h3Color')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('h4')">
              <span>H4</span>
              <strong>{{ optionLabel(headingModeOptions, settings.h4Mode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('h4') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('h4')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in headingModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.h4Mode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.h4Mode = opt.key as typeof settings.h4Mode"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row color-setting-row--plain">
                <div class="color-line">
                  <button
                    v-for="preset in TEXT_COLOR_PRESETS"
                    :key="`h4-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h4Color === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('h4Color', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`h4-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.h4Color === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('h4Color', color)"
                  />
                  <button
                    type="button"
                    class="custom-color-button"
                    title="自选颜色"
                    @click="toggleColorPicker('h4Color')"
                  >
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('h4Color')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.h4Color || '#332b24'"
                    @input="updateCustomColor('h4Color', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('h4Color')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('bold')">
              <span>加粗</span>
              <strong>{{ optionLabel(boldModeOptions, settings.boldMode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('bold') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('bold')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in boldModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.boldMode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.boldMode = opt.key"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row">
                <span class="control-label">颜色</span>
                <div class="color-line">
                  <button
                    v-for="preset in ACCENT_PRESETS"
                    :key="`bold-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.boldColor === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('boldColor', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`bold-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.boldColor === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('boldColor', color)"
                  />
                  <button type="button" class="custom-color-button" title="自选颜色" @click="toggleColorPicker('boldColor')">
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('boldColor')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.boldColor || settings.accentColor"
                    @input="updateCustomColor('boldColor', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('boldColor')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('underline')">
              <span>分割线</span>
              <strong>{{ optionLabel(underlineModeOptions, settings.underlineMode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('underline') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('underline')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in underlineModeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="settings.underlineMode === opt.key ? 'segmented-button--active' : ''"
                  @click="settings.underlineMode = opt.key"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="color-setting-row">
                <span class="control-label">颜色</span>
                <div class="color-line">
                  <button
                    v-for="preset in ACCENT_PRESETS"
                    :key="`line-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.underlineColor === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('underlineColor', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`line-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.underlineColor === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('underlineColor', color)"
                  />
                  <button type="button" class="custom-color-button" title="自选颜色" @click="toggleColorPicker('underlineColor')">
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('underlineColor')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.underlineColor || settings.accentColor"
                    @input="updateCustomColor('underlineColor', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetUnderlineColors">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('quote')">
              <span>引用</span>
              <strong>{{ optionLabel(quoteModeOptions, settings.quoteMode) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('quote') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('quote')" class="accordion-body">
              <div class="setting-row">
                <span class="control-label">一级</span>
                <div class="segmented">
                  <button
                    v-for="opt in quoteModeOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.quoteMode === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.quoteMode = opt.key as typeof settings.quoteMode"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="setting-row">
                <span class="control-label">二级</span>
                <div class="segmented">
                  <button
                    v-for="opt in quoteMode2Options"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.quoteMode2 === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.quoteMode2 = opt.key as typeof settings.quoteMode2"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="color-setting-row">
                <span class="control-label">颜色</span>
                <div class="color-line">
                  <button
                    v-for="preset in ACCENT_PRESETS"
                    :key="`quote-${preset.color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.quoteAccent === preset.color ? 'color-swatch--active' : ''"
                    :title="preset.label"
                    :aria-label="preset.label"
                    :style="{ background: preset.color }"
                    @click="setColor('quoteAccent', preset.color)"
                  />
                  <button
                    v-for="color in visibleColorHistory"
                    :key="`quote-history-${color}`"
                    type="button"
                    class="color-swatch"
                    :class="settings.quoteAccent === color ? 'color-swatch--active' : ''"
                    :style="{ background: color }"
                    :title="color"
                    :aria-label="color"
                    @click="setColor('quoteAccent', color)"
                  />
                  <button type="button" class="custom-color-button" title="自选颜色" @click="toggleColorPicker('quoteAccent')">
                    <AppIcon name="pen" :size="13" />
                  </button>
                  <input
                    v-if="isColorPickerOpen('quoteAccent')"
                    type="color"
                    class="inline-color-input"
                    :value="settings.quoteAccent || settings.accentColor"
                    @input="updateCustomColor('quoteAccent', $event)"
                  />
                  <button type="button" class="reset-inline" @click="resetColor('quoteAccent')">
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('code')">
              <span>代码块</span>
              <strong>{{ optionLabel(codeThemeOptions, themeStore.currentCodeThemeKey) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('code') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('code')" class="accordion-body">
              <div class="segmented">
                <button
                  v-for="opt in codeThemeOptions"
                  :key="opt.key"
                  type="button"
                  class="segmented-button"
                  :class="
                    themeStore.currentCodeThemeKey === opt.key ? 'segmented-button--active' : ''
                  "
                  @click="themeStore.currentCodeThemeKey = opt.key"
                >
                  {{ opt.label }}
                </button>
              </div>
              <div class="switch-grid">
                <button
                  type="button"
                  class="switch-card"
                  :class="settings.macCodeBlock ? 'switch-card--active' : ''"
                  @click="settings.macCodeBlock = !settings.macCodeBlock"
                >
                  <span>Mac 红绿灯</span>
                  <span class="switch-dot" />
                </button>
                <button
                  type="button"
                  class="switch-card"
                  :class="settings.codeLineNumbers ? 'switch-card--active' : ''"
                  @click="settings.codeLineNumbers = !settings.codeLineNumbers"
                >
                  <span>行号</span>
                  <span class="switch-dot" />
                </button>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('wechat')">
              <span>公众号尾部</span>
              <strong>{{ settings.wechatElements.followEnabled ? '开启' : '关闭' }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('wechat') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('wechat')" class="accordion-body">
              <button
                type="button"
                class="switch-card switch-card--wide"
                :class="settings.wechatElements.followEnabled ? 'switch-card--active' : ''"
                @click="
                  settings.updateWechatElements({
                    followEnabled: !settings.wechatElements.followEnabled,
                  })
                "
              >
                <span>关注引导</span>
                <span class="switch-dot" />
              </button>
              <template v-if="settings.wechatElements.followEnabled">
                <input
                  :value="settings.wechatElements.followName"
                  type="text"
                  placeholder="公众号名称"
                  class="setting-input"
                  @input="
                    (e) =>
                      settings.updateWechatElements({
                        followName: (e.target as HTMLInputElement).value,
                      })
                  "
                />
                <input
                  :value="settings.wechatElements.followSlogan"
                  type="text"
                  placeholder="引导语"
                  class="setting-input"
                  @input="
                    (e) =>
                      settings.updateWechatElements({
                        followSlogan: (e.target as HTMLInputElement).value,
                      })
                  "
                />
              </template>
            </div>
          </article>
        </div>
      </section>

      <section v-else class="section-stack">
        <div class="section-heading">
          <div>
            <h3>草稿</h3>
            <p>本地保存</p>
          </div>
        </div>
        <DraftPanel />
      </section>
    </div>
  </aside>
</template>

<style scoped>
.settings-header {
  min-height: 58px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

.settings-header__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
}

.settings-title {
  margin: 0;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--color-text);
}

.settings-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.3;
  color: var(--color-text-tertiary);
}

.preview-control {
  padding: 10px 12px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.settings-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
  flex-shrink: 0;
}

.settings-tab {
  min-width: 0;
  min-height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 650;
  color: var(--color-text-tertiary);
  transition:
    background 0.16s ease,
    color 0.16s ease;
}

.settings-tab:hover,
.settings-tab--active {
  color: var(--color-text);
  background: var(--color-bg);
}

.settings-tab--active {
  box-shadow: inset 0 0 0 1px var(--color-border-subtle);
}

.settings-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-heading h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.25;
  font-weight: 750;
}

.section-heading p {
  margin: 3px 0 0;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.35;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-group--plain {
  padding-top: 0;
}

.setting-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.setting-row--inline {
  grid-template-columns: 44px minmax(0, 1fr);
}

.control-label {
  display: block;
  font-size: 11px;
  line-height: 1.2;
  color: var(--color-text-tertiary);
}

.segmented {
  min-width: 0;
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
}

.segmented--compact {
  gap: 2px;
}

.segmented-button {
  flex: 1 1 0;
  min-width: 0;
  min-height: 30px;
  padding: 0 6px;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.segmented--compact .segmented-button {
  flex-basis: 0;
}

.segmented-button:hover {
  color: var(--color-text);
}

.segmented-button--active {
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-xs);
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.switch-grid--single {
  grid-template-columns: 1fr;
}

.switch-card {
  min-width: 0;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
  font-size: 12px;
  font-weight: 650;
}

.switch-card--wide {
  width: 100%;
}

.switch-card--active {
  color: var(--color-text);
  background: var(--color-surface);
  border-color: rgb(24 24 27 / 0.22);
}

.switch-dot {
  width: 26px;
  height: 16px;
  border-radius: 999px;
  position: relative;
  flex-shrink: 0;
  background: var(--color-border);
  transition: background 0.18s ease;
}

.switch-dot::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.18);
  transition: transform 0.18s ease;
}

.switch-card--active .switch-dot {
  background: var(--color-accent);
}

.switch-card--active .switch-dot::after {
  transform: translateX(10px);
}

.accordion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.accordion-item {
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg);
  overflow: hidden;
}

.accordion-button {
  width: 100%;
  min-height: 44px;
  padding: 0 10px 0 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.accordion-button span {
  min-width: 0;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 750;
}

.accordion-button strong {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

.accordion-chevron {
  color: var(--color-text-tertiary);
  transition: transform 0.18s ease;
}

.accordion-body {
  padding: 0 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-setting-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.color-setting-row--plain {
  grid-template-columns: minmax(0, 1fr);
}

.color-line {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, 22px) repeat(3, 22px) 26px auto minmax(56px, 1fr);
  align-items: center;
  gap: 5px;
  overflow: hidden;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.custom-color-button {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--color-border);
  background:
    linear-gradient(90deg, #f87171 0 25%, #facc15 25% 50%, #4ade80 50% 75%, #60a5fa 75%);
  cursor: pointer;
  overflow: hidden;
}

.inline-color-input {
  width: 28px;
  height: 26px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.reset-inline {
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border-radius: 8px;
  color: var(--color-text-tertiary);
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.color-swatch:hover {
  transform: translateY(-1px);
}

.color-swatch--light {
  border-color: var(--color-border-subtle);
}

.color-swatch--active {
  border-color: var(--color-text);
  box-shadow:
    0 0 0 2px var(--color-surface),
    0 0 0 4px rgb(24 24 27 / 0.16);
}

.setting-input {
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 12px;
}

.setting-input::placeholder {
  color: var(--color-text-tertiary);
}

.setting-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgb(24 24 27 / 0.08);
}

@media (max-width: 767px) {
  .settings-body {
    padding: 12px;
  }

  .settings-tab {
    min-height: 44px;
  }
}
</style>
