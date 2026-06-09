<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore, FONT_FAMILIES, STYLE_PRESETS } from '@/stores/settings'
import { codeThemes } from '@/config/themes'
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
            :class="settings.activeStylePreset === preset.key ? 'theme-card--active' : ''"
            :style="themeCardStyle(preset)"
            @click="settings.applyStylePreset(preset.key)"
          >
            <span class="theme-card__preview" aria-hidden="true">
              <span class="theme-paper">
                <span class="theme-paper__title" />
                <span class="theme-paper__line theme-paper__line--long" />
                <span class="theme-paper__line" />
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
              <ColorPresetControl
                kind="accent"
                :value="settings.quoteAccent"
                :fallback="settings.accentColor"
                @change="(color) => applyColor('quoteAccent', color)"
              />
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
  gap: 10px;
}

.theme-card {
  min-width: 0;
  min-height: 104px;
  padding: 10px;
  border-radius: 10px;
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  align-items: stretch;
  gap: 11px;
  color: var(--color-text);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--theme-soft, #f4f4f5) 72%, white), white 58%),
    var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--theme-border, var(--color-border-subtle)) 72%, transparent);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.theme-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--theme-color, var(--color-accent)) 46%, var(--color-border));
  box-shadow:
    0 10px 22px rgb(24 24 27 / 0.06),
    0 0 0 1px color-mix(in srgb, var(--theme-color, var(--color-accent)) 16%, transparent);
}

.theme-card--active {
  border-color: color-mix(in srgb, var(--theme-color, var(--color-accent)) 62%, var(--color-border));
  box-shadow:
    0 10px 22px rgb(24 24 27 / 0.07),
    inset 0 0 0 1px color-mix(in srgb, var(--theme-color, var(--color-accent)) 22%, transparent);
}

.theme-card__preview {
  min-width: 0;
  min-height: 84px;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--theme-canvas, #ffffff);
  border: 1px solid color-mix(in srgb, var(--theme-border, #e4e4e7) 72%, transparent);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.56);
}

.theme-paper {
  min-height: 50px;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: color-mix(in srgb, var(--theme-soft, #f4f4f5) 68%, white);
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
