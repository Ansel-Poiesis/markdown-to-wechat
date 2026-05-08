<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import type { MarkdownStats, WarningItem } from '@/types'

const props = defineProps<{
  stats: MarkdownStats
  warnings: WarningItem[]
}>()

const themeStore = useThemeStore()
const ui = useUiStore()
const settingsStore = useSettingsStore()

const statsData = computed(() => [
  { label: '字数', value: props.stats.wordCount },
  { label: '阅读', value: `${props.stats.readingMinutes} 分钟` },
  { label: '标题', value: props.stats.headings },
  { label: '图片', value: props.stats.images },
])

const themeList = computed(() => Object.entries(themeStore.allThemes))

function selectTheme(key: string) {
  themeStore.currentThemeKey = key
}

function openThemeEditor() {
  ui.openModal('themeEditor')
}

function updateImageSetting(key: 'width' | 'radius' | 'caption', value: unknown) {
  settingsStore.updateImageSettings({ [key]: value })
}

function toggleFocus() {
  settingsStore.isFocusPreview = !settingsStore.isFocusPreview
}
</script>

<template>
  <aside
    class="animate-panel-3 flex flex-col min-h-0 rounded-2xl bg-surface shadow-sm overflow-hidden dark:border dark:border-border"
    aria-label="兼容性提示"
  >
    <div class="flex items-center justify-between gap-3 h-11 px-4 shrink-0 text-[11px] font-semibold tracking-widest uppercase text-text-tertiary border-b border-border-subtle dark:border-border sticky top-0 z-[2] bg-surface">
      <strong class="text-text-secondary font-semibold">创作助手</strong>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pb-5">
      <!-- Stats -->
      <div class="grid grid-cols-2 gap-2 py-4">
        <div
          v-for="item in statsData"
          :key="item.label"
          class="rounded-lg border border-border-subtle dark:border-border bg-surface-hover/50 dark:bg-surface-hover/30 px-3 py-2.5"
        >
          <strong class="block text-xl font-semibold tabular-nums tracking-tight leading-tight text-text">{{ item.value }}</strong>
          <span class="block mt-0.5 text-[10px] font-semibold tracking-widest uppercase text-text-tertiary">{{ item.label }}</span>
        </div>
      </div>

      <!-- Warnings -->
      <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-3.5 h-3.5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">质量检查</h2>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(w, i) in warnings"
            :key="i"
            class="warning"
            :class="w.level"
          >
            {{ w.text }}
          </div>
          <div v-if="!warnings.length" class="empty-state">
            <p>当前内容没有明显的公众号兼容性风险</p>
          </div>
        </div>
      </div>

      <!-- Themes -->
      <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-3.5 h-3.5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">主题速览</h2>
        </div>
        <div class="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
          <button
            v-for="[key, theme] in themeList"
            :key="key"
            class="group flex items-center gap-3 w-full p-2 rounded-lg text-left bg-transparent hover:bg-surface-hover transition-all border"
            :class="themeStore.currentThemeKey === key
              ? 'border-border bg-surface-hover shadow-sm'
              : 'border-transparent hover:border-border-subtle'"
            type="button"
            @click="selectTheme(key)"
          >
            <span
              class="w-8 h-8 rounded-md border shrink-0 grid place-items-center overflow-hidden"
              :class="themeStore.currentThemeKey === key ? 'border-border' : 'border-border-subtle group-hover:border-border'"
              :style="{ background: theme.base.canvas || theme.base.bgSoft }"
            >
              <span class="flex flex-col items-center gap-[3px]">
                <span class="block w-4 h-[2px] rounded-full" :style="{ background: theme.base.accent }" />
                <span class="block w-3 h-[2px] rounded-full" :style="{ background: theme.base.border }" />
              </span>
            </span>
            <span class="min-w-0">
              <strong class="block text-[13px] font-medium leading-tight text-text truncate">{{ theme.name }}</strong>
              <span class="block mt-0.5 text-[11px] leading-snug text-text-tertiary truncate">{{ theme.description }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Custom Theme -->
      <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border">
        <button
          type="button"
          class="w-full h-9 px-3.5 rounded-lg text-[13px] font-medium hover:bg-surface-hover bg-transparent border border-border-subtle hover:border-border transition-all"
          @click="openThemeEditor"
        >
          ✨ 编辑我的主题
        </button>
      </div>

      <!-- Image Settings -->
      <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-3.5 h-3.5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">图片设置</h2>
        </div>
        <div class="space-y-3">
          <label class="block">
            <span class="block text-xs font-medium text-text-secondary mb-1.5">图片宽度</span>
            <select
              class="w-full"
              :value="settingsStore.imageSettings.width"
              @change="e => updateImageSetting('width', (e.target as HTMLSelectElement).value)"
            >
              <option value="100%">100%</option>
              <option value="92%">92%</option>
              <option value="80%">80%</option>
            </select>
          </label>
          <label class="block">
            <span class="block text-xs font-medium text-text-secondary mb-1.5">圆角</span>
            <input
              type="range"
              min="0"
              max="16"
              :value="settingsStore.imageSettings.radius"
              @input="e => updateImageSetting('radius', Number((e.target as HTMLInputElement).value))"
            />
          </label>
          <label class="flex items-center gap-2.5 text-[13px] text-text-secondary">
            <input
              type="checkbox"
              :checked="settingsStore.imageSettings.caption"
              @change="e => updateImageSetting('caption', (e.target as HTMLInputElement).checked)"
            />
            <span>使用 alt 文本生成图注</span>
          </label>
        </div>
      </div>

      <!-- Preview Layout -->
      <div class="mt-4 pt-4 border-t border-border-subtle dark:border-border">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-3.5 h-3.5 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h2 class="text-[11px] font-semibold tracking-widest uppercase text-text-tertiary">预览布局</h2>
        </div>
        <div class="space-y-3">
          <label class="block">
            <span class="block text-xs font-medium text-text-secondary mb-1.5">缩放</span>
            <select v-model="settingsStore.previewZoom" class="w-full">
              <option :value="0.86">86%</option>
              <option :value="1">100%</option>
              <option :value="1.12">112%</option>
            </select>
          </label>
          <button
            type="button"
            class="w-full h-9 px-3.5 rounded-lg text-[13px] font-medium hover:bg-surface-hover bg-transparent border border-border-subtle hover:border-border transition-all"
            @click="toggleFocus"
          >
            {{ settingsStore.isFocusPreview ? '退出专注' : '专注预览' }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
input[type="checkbox"] {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;
}

input[type="checkbox"]:checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
}
</style>
