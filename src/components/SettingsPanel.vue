<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { FONT_FAMILIES } from '@/config/typography'
import { useSettingsStore, STYLE_PRESETS } from '@/stores/settings'
import { codeThemes } from '@/config/themes'
import { designThemes } from '@/config/designThemes'
import type { BoldMode, FontFamilyKey, UnderlineMode } from '@/types'
import AppIcon from '@/components/ui/AppIcon.vue'
import DraftPanel from '@/components/DraftPanel.vue'
import ColorPresetControl from '@/components/settings/ColorPresetControl.vue'

type IconName = InstanceType<typeof AppIcon>['$props']['name']
type SettingsTab = 'theme' | 'style' | 'drafts'
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
  | 'lists'
  | 'structure'

const themeStore = useThemeStore()
const settings = useSettingsStore()

const activeTab = ref<SettingsTab>('theme')
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
  lists: false,
  structure: false,
})

const tabs: Array<{ key: SettingsTab; label: string; icon: IconName }> = [
  { key: 'theme', label: '主题', icon: 'palette' },
  { key: 'style', label: '样式', icon: 'palette' },
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

const fontSizeOptions = [12, 14, 16, 18, 20]
const lineHeightOptions = [1, 1.6, 2, 2.6, 3]
const pageMarginOptions = [12, 20, 28, 34, 36]
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

const coverComponentOptions = [
  { key: '', label: '跟随主题' },
  { key: 'editorial', label: '编辑部' },
  { key: 'cinnabar', label: '朱砂刊头' },
  { key: 'minimal', label: '黑白极简' },
  { key: 'index', label: '索引封面' },
  { key: 'botanical', label: '自然留白' },
  { key: 'paper', label: '纸本封面' },
  { key: 'soft', label: '柔光封面' },
  { key: 'ticket', label: '票据封面' },
  { key: 'guide', label: '指南封面' },
]

const sectionComponentOptions = [
  { key: '', label: '主题', title: '跟随主题' },
  { key: 'numbered', label: '编号', title: '大号编号' },
  { key: 'rule', label: '底线', title: '底线标题' },
  { key: 'label', label: '侧标', title: '侧标标题' },
  { key: 'marker', label: '标记', title: '标记标题' },
  { key: 'stamp', label: '印章', title: '印章标题' },
]

const quoteComponentOptions = [
  { key: '', label: '跟随主题' },
  { key: 'pull', label: '金句引用' },
  { key: 'panel', label: '面板引用' },
  { key: 'bar', label: '边线引用' },
  { key: 'note', label: '笔记引用' },
  { key: 'outline', label: '描边引用' },
]

const listComponentOptions = [
  { key: '', label: '跟随主题' },
  { key: 'plain', label: '简洁列表' },
  { key: 'cards', label: '卡片列表' },
  { key: 'steps', label: '步骤列表' },
  { key: 'ledger', label: '清单列表' },
]

const tableComponentOptions = [
  { key: '', label: '跟随主题' },
  { key: 'grid', label: '网格表格' },
  { key: 'striped', label: '浅底表格' },
  { key: 'ledger', label: '账页表格' },
]

const visibilityOptions = [
  { key: 'theme', label: '跟随主题' },
  { key: 'show', label: '显示' },
  { key: 'hide', label: '隐藏' },
]

const typographySummary = computed(() => {
  const family = FONT_FAMILIES[settings.fontFamilyKey]?.label ?? '字体'
  return `${family} · ${settings.fontSize}px · ${settings.lineHeight.toFixed(1)}`
})

const activeThemeEndMark = computed(
  () => designThemes[settings.activeStylePreset || 'qiuhe'].endMark,
)

const hasComponentOverrides = computed(
  () =>
    Boolean(settings.componentCover) ||
    Boolean(settings.componentSection) ||
    Boolean(settings.componentQuote) ||
    Boolean(settings.componentUnorderedList) ||
    Boolean(settings.componentOrderedList) ||
    Boolean(settings.componentTable) ||
    settings.componentTocMode !== 'theme' ||
    settings.componentEndMarkMode !== 'theme' ||
    Boolean(settings.componentEndMarkText.trim()),
)

const listTableSummary = computed(() =>
  settings.componentUnorderedList || settings.componentOrderedList || settings.componentTable
    ? '已单独设置'
    : '跟随主题',
)

const structureSummary = computed(() => {
  if (settings.componentEndMarkText.trim()) return '结尾已编辑'
  if (settings.componentTocMode === 'theme' && settings.componentEndMarkMode === 'theme') {
    return '跟随主题'
  }
  if (settings.componentTocMode === 'show' && settings.componentEndMarkMode === 'show') {
    return '全部显示'
  }
  if (settings.componentTocMode === 'hide' && settings.componentEndMarkMode === 'hide') {
    return '全部隐藏'
  }
  return '已单独设置'
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

function applyColor(target: string, color: string) {
  ;(settings as unknown as Record<string, string>)[target] = color
}

function themeCardStyle(preset: (typeof STYLE_PRESETS)[number]) {
  return {
    '--theme-color': preset.color,
    '--theme-canvas': preset.settings.canvasColor,
    '--theme-soft': preset.settings.bgSoftColor,
    '--theme-border': preset.settings.borderColor,
    '--theme-text': preset.settings.textColor,
  }
}
</script>

<template>
  <aside
    class="flex flex-col min-h-0 rounded-lg bg-surface overflow-hidden border border-border shadow-sm"
    aria-label="设置"
  >
    <header class="settings-header">
      <div class="flex items-center gap-3 min-w-0">
        <span class="settings-header__icon">
          <AppIcon name="settings" :size="15" />
        </span>
        <div class="min-w-0">
          <h2 class="settings-title">设置</h2>
        </div>
      </div>
    </header>

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
      <section v-if="activeTab === 'theme'" class="section-stack">
        <div class="theme-grid">
          <button
            v-for="preset in STYLE_PRESETS"
            :key="preset.key"
            type="button"
            class="theme-card"
            :class="[
              `theme-card--${preset.key}`,
              settings.activeStylePreset === preset.key ? 'theme-card--active' : '',
            ]"
            :style="themeCardStyle(preset)"
            :aria-pressed="settings.activeStylePreset === preset.key"
            @click="settings.applyStylePreset(preset.key)"
          >
            <span class="theme-card__preview" aria-hidden="true">
              <span class="theme-paper">
                <span class="theme-paper__eyebrow" />
                <span class="theme-paper__title" />
                <span class="theme-paper__line theme-paper__line--long" />
                <span class="theme-paper__line" />
                <span class="theme-paper__accent" />
              </span>
              <span class="theme-card__swatches">
                <span :style="{ background: preset.settings.canvasColor }" />
                <span :style="{ background: preset.settings.textColor }" />
                <span :style="{ background: preset.settings.accentColor }" />
                <span :style="{ background: preset.settings.bgSoftColor }" />
              </span>
            </span>
            <span class="theme-card__copy">
              <strong>{{ preset.label }}</strong>
              <small>{{ preset.description }}</small>
            </span>
          </button>
        </div>
      </section>

      <section v-else-if="activeTab === 'style'" class="section-stack">
        <div class="setting-row setting-row--inline">
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
        </div>
        <div class="section-heading section-heading--action">
          <div>
            <h3>正文样式</h3>
            <p>{{ typographySummary }}</p>
          </div>
          <button
            type="button"
            class="reset-command"
            :disabled="!hasComponentOverrides"
            @click="settings.resetComponentOverrides()"
          >
            组件跟随主题
          </button>
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
        </div>

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
              <ColorPresetControl
                kind="background"
                :value="settings.canvasColor || '#ffffff'"
                fallback="#ffffff"
                light
                @change="(color) => applyColor('canvasColor', color)"
              />
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
              <div class="choice-row">
                <span class="control-label">封面结构</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
                  <button
                    v-for="opt in coverComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.componentCover === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.componentCover = opt.key as typeof settings.componentCover"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span class="control-label">标题装饰</span>
                <div class="segmented segmented--grid" style="--segment-columns: 6">
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
              </div>
              <ColorPresetControl
                kind="text"
                :value="settings.h1Color"
                fallback="#332b24"
                @change="(color) => applyColor('h1Color', color)"
              />
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
              <div class="choice-row">
                <span class="control-label">章节结构</span>
                <div class="segmented segmented--grid" style="--segment-columns: 6">
                  <button
                    v-for="opt in sectionComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.componentSection === opt.key ? 'segmented-button--active' : ''"
                    :title="opt.title"
                    :aria-label="opt.title"
                    @click="settings.componentSection = opt.key as typeof settings.componentSection"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span class="control-label">标题装饰</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
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
              </div>
              <ColorPresetControl
                kind="text"
                :value="settings.h2Color"
                fallback="#332b24"
                @change="(color) => applyColor('h2Color', color)"
              />
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
              <div class="choice-row">
                <span class="control-label">标题装饰</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
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
              </div>
              <ColorPresetControl
                kind="text"
                :value="settings.h3Color"
                fallback="#332b24"
                @change="(color) => applyColor('h3Color', color)"
              />
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
              <div class="choice-row">
                <span class="control-label">标题装饰</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
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
              </div>
              <ColorPresetControl
                kind="text"
                :value="settings.h4Color"
                fallback="#332b24"
                @change="(color) => applyColor('h4Color', color)"
              />
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
              <ColorPresetControl
                kind="accent"
                :value="settings.boldColor"
                :fallback="settings.accentColor"
                @change="(color) => applyColor('boldColor', color)"
              />
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
              <ColorPresetControl
                kind="accent"
                :value="settings.underlineColor"
                :fallback="settings.accentColor"
                @change="(color) => applyColor('underlineColor', color)"
              />
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('quote')">
              <span>引用</span>
              <strong>{{ optionLabel(quoteComponentOptions, settings.componentQuote) }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('quote') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('quote')" class="accordion-body">
              <div class="choice-row">
                <span class="control-label">引用结构</span>
                <div class="segmented segmented--grid" style="--segment-columns: 3">
                  <button
                    v-for="opt in quoteComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.componentQuote === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.componentQuote = opt.key as typeof settings.componentQuote"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <ColorPresetControl
                kind="accent"
                :value="settings.quoteAccent"
                :fallback="settings.accentColor"
                @change="(color) => applyColor('quoteAccent', color)"
              />
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('lists')">
              <span>列表与表格</span>
              <strong>{{ listTableSummary }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('lists') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('lists')" class="accordion-body">
              <div class="choice-row">
                <span class="control-label">无序列表</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
                  <button
                    v-for="opt in listComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="
                      settings.componentUnorderedList === opt.key ? 'segmented-button--active' : ''
                    "
                    @click="
                      settings.componentUnorderedList =
                        opt.key as typeof settings.componentUnorderedList
                    "
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span class="control-label">有序列表</span>
                <div class="segmented segmented--grid" style="--segment-columns: 5">
                  <button
                    v-for="opt in listComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="
                      settings.componentOrderedList === opt.key ? 'segmented-button--active' : ''
                    "
                    @click="
                      settings.componentOrderedList =
                        opt.key as typeof settings.componentOrderedList
                    "
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span class="control-label">表格</span>
                <div class="segmented segmented--grid" style="--segment-columns: 4">
                  <button
                    v-for="opt in tableComponentOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.componentTable === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.componentTable = opt.key as typeof settings.componentTable"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article class="accordion-item">
            <button type="button" class="accordion-button" @click="toggleSection('structure')">
              <span>目录与结尾</span>
              <strong>{{ structureSummary }}</strong>
              <AppIcon
                name="chevronDown"
                :size="14"
                class="accordion-chevron"
                :class="isOpen('structure') ? '' : '-rotate-90'"
              />
            </button>
            <div v-show="isOpen('structure')" class="accordion-body">
              <div class="choice-row">
                <span class="control-label">文章目录</span>
                <div class="segmented">
                  <button
                    v-for="opt in visibilityOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="settings.componentTocMode === opt.key ? 'segmented-button--active' : ''"
                    @click="settings.componentTocMode = opt.key as typeof settings.componentTocMode"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="choice-row">
                <span class="control-label">结尾显示</span>
                <div class="segmented">
                  <button
                    v-for="opt in visibilityOptions"
                    :key="opt.key"
                    type="button"
                    class="segmented-button"
                    :class="
                      settings.componentEndMarkMode === opt.key ? 'segmented-button--active' : ''
                    "
                    @click="
                      settings.componentEndMarkMode =
                        opt.key as typeof settings.componentEndMarkMode
                    "
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <label class="text-field">
                <span class="control-label">结尾文字</span>
                <span class="text-field__control">
                  <input
                    v-model="settings.componentEndMarkText"
                    class="setting-input"
                    type="text"
                    maxlength="32"
                    :placeholder="`跟随主题：${activeThemeEndMark}`"
                    @input="settings.componentEndMarkMode = 'show'"
                  />
                  <button
                    type="button"
                    class="field-reset"
                    :disabled="!settings.componentEndMarkText"
                    title="恢复主题结尾文字"
                    @click="settings.componentEndMarkText = ''"
                  >
                    恢复
                  </button>
                </span>
              </label>
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
        </div>
      </section>

      <section v-else class="section-stack">
        <div class="section-heading">
          <div>
            <h3>草稿</h3>
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

.theme-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.theme-card {
  min-width: 0;
  min-height: 96px;
  padding: 9px;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  position: relative;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.theme-card:hover {
  border-color: color-mix(
    in srgb,
    var(--theme-color, var(--color-accent)) 54%,
    var(--color-border)
  );
  background: var(--color-surface-hover);
}

.theme-card--active {
  border-color: var(--theme-color, var(--color-accent));
  box-shadow: inset 3px 0 0 var(--theme-color, var(--color-accent));
}

.theme-card__preview {
  min-width: 0;
  min-height: 72px;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--theme-canvas, #ffffff);
  border: 1px solid color-mix(in srgb, var(--theme-border, #e4e4e7) 72%, transparent);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.04);
}

.theme-paper {
  min-height: 42px;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: color-mix(in srgb, var(--theme-soft, #f4f4f5) 68%, white);
}

.theme-paper__eyebrow {
  width: 18px;
  height: 2px;
  background: color-mix(in srgb, var(--theme-color) 62%, transparent);
}

.theme-paper__title {
  width: 32px;
  height: 4px;
  border-radius: 99px;
  background: var(--theme-color, var(--color-accent));
}

.theme-paper__line {
  width: 28px;
  height: 3px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--theme-text, var(--color-text)) 32%, transparent);
}

.theme-paper__line--long {
  width: 43px;
}

.theme-paper__accent {
  width: 100%;
  height: 1px;
  margin-top: auto;
  background: color-mix(in srgb, var(--theme-color) 46%, transparent);
}

.theme-card--zhujian .theme-paper {
  border-top: 4px solid var(--theme-color);
  border-radius: 2px;
}

.theme-card--songyan .theme-paper {
  border-radius: 0;
  border-left: 4px solid var(--theme-text);
  background: var(--theme-canvas);
}

.theme-card--songyan .theme-paper__title {
  width: 46px;
  background: var(--theme-text);
}

.theme-card--yuebai .theme-paper__eyebrow {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid var(--theme-color);
}

.theme-card--qingdai .theme-paper {
  align-items: center;
  justify-content: center;
}

.theme-card--qingdai .theme-paper__line {
  width: 36px;
}

.theme-card--zhuzhi .theme-paper {
  border-radius: 0;
  box-shadow: inset 0 0 0 1px var(--theme-color);
}

.theme-card--haitang .theme-paper {
  border-radius: 10px;
}

.theme-card--haitang .theme-paper__title {
  width: 38px;
  border-radius: 999px;
}

.theme-card--shupian .theme-paper {
  border-radius: 0;
  border-left: 7px solid var(--theme-color);
}

.theme-card--liujin .theme-paper {
  border-bottom: 5px solid var(--theme-color);
}

.theme-card__swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.theme-card__swatches span {
  height: 8px;
  border-radius: 99px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.theme-card__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
}

.theme-card__copy strong {
  color: var(--color-text);
  font-size: 15px;
  line-height: 1.2;
  font-weight: 760;
}

.theme-card__copy small {
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 1.55;
  font-weight: 550;
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

.section-heading--action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.reset-command {
  min-height: 30px;
  padding: 0 9px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border: 1px solid var(--color-border-subtle);
  font-size: 11px;
  font-weight: 650;
}

.reset-command:disabled {
  cursor: default;
  opacity: 0.45;
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

.choice-row,
.text-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
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

.segmented--grid {
  display: grid;
  grid-template-columns: repeat(var(--segment-columns), minmax(0, 1fr));
  gap: 2px;
}

.segmented--grid .segmented-button {
  padding: 0 2px;
  font-size: 10px;
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
  box-shadow:
    var(--shadow-xs),
    inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent);
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
  border-color: color-mix(in srgb, var(--color-accent) 38%, var(--color-border));
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
  background: var(--color-control-thumb);
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
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
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
  padding: 2px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.text-field__control {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
}

.field-reset {
  min-width: 48px;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 11px;
  font-weight: 650;
}

.field-reset:disabled {
  cursor: default;
  opacity: 0.42;
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
