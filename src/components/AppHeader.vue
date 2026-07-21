<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useClipboard } from '@/composables/useClipboard'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { WarningItem, MarkdownStats } from '@/types'

const props = defineProps<{
  renderedHtml: string
  warnings: WarningItem[]
  stats: MarkdownStats
}>()

const emit = defineEmits<{ exportHtml: [] }>()

const ui = useUiStore()
const { copyRenderedHtml } = useClipboard()

const hasBlockingWarnings = computed(() => props.warnings.some((w) => w.level === 'danger'))

async function handleCopy() {
  if (hasBlockingWarnings.value) {
    ui.openModal('preflight')
    return
  }
  await copyRenderedHtml(props.renderedHtml)
}

function handleExport() {
  emit('exportHtml')
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <h1 class="app-header__title">微信 Markdown 排版</h1>
        <p class="app-header__description">生成公众号可粘贴的内联 HTML</p>
      </div>

      <div class="app-header__stats hidden md:flex">
        <span class="flex items-center gap-1.5 tabular-nums">
          <strong class="text-text font-bold text-sm">{{ stats.wordCount }}</strong>
          <span>字</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums">
          <strong class="text-text font-bold text-sm">{{ stats.readingMinutes }}</strong>
          <span>分钟</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums">
          <strong class="text-text font-bold text-sm">{{ stats.headings }}</strong>
          <span>标题</span>
        </span>
        <span class="w-px h-3 bg-border mx-2" />
        <span class="flex items-center gap-1.5 tabular-nums">
          <strong class="text-text font-bold text-sm">{{ stats.images }}</strong>
          <span>图片</span>
        </span>
      </div>

      <div class="app-header__actions">
        <button
          type="button"
          class="header-icon-button"
          :title="ui.colorMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
          :aria-label="ui.colorMode === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
          @click="ui.toggleColorMode()"
        >
          <AppIcon :name="ui.colorMode === 'dark' ? 'sun' : 'moon'" :size="15" />
        </button>
        <button
          type="button"
          class="header-secondary-button"
          title="导出 HTML"
          @click="handleExport"
        >
          <AppIcon name="download" :size="14" />
          <span class="hidden sm:inline">导出</span>
        </button>
        <button
          type="button"
          class="header-primary-button"
          title="复制到公众号"
          @click="handleCopy"
        >
          <AppIcon name="copy" :size="14" />
          <span class="hidden sm:inline">复制到公众号</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  max-width: 100vw;
  height: 64px;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.04);
  backdrop-filter: blur(18px);
}

.app-header__inner {
  width: 100%;
  max-width: min(1760px, 100vw);
  height: 100%;
  margin: 0 auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
}

.app-header__brand {
  min-width: 0;
}

.app-header__title {
  margin: 0;
  color: var(--color-text);
  font-size: 16px;
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__description {
  margin: 3px 0 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.2;
  font-weight: 560;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__stats {
  align-items: center;
  gap: 4px;
  justify-self: center;
  color: var(--color-text-tertiary);
  background: color-mix(in srgb, var(--color-surface-hover) 88%, transparent);
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  padding: 8px 14px;
  font-size: 11px;
}

.app-header__actions {
  min-width: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.header-icon-button,
.header-secondary-button,
.header-primary-button {
  height: 36px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  line-height: 1;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.header-icon-button {
  width: 36px;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.header-secondary-button {
  min-width: 36px;
  padding: 0 12px;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-weight: 620;
}

.header-primary-button {
  min-width: 40px;
  padding: 0 15px;
  color: var(--color-accent-contrast);
  background: var(--color-accent);
  border: 1px solid var(--color-accent);
  font-weight: 680;
}

.header-icon-button:hover,
.header-secondary-button:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.header-primary-button:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.header-icon-button:active,
.header-secondary-button:active,
.header-primary-button:active {
  transform: scale(0.96);
}

.header-icon-button:focus,
.header-secondary-button:focus,
.header-primary-button:focus {
  outline: none;
}

.header-icon-button:focus-visible,
.header-secondary-button:focus-visible,
.header-primary-button:focus-visible {
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

@media (max-width: 767px) {
  .app-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 0 12px;
  }

  .app-header__title {
    font-size: 16px;
  }

  .app-header__description {
    display: none;
  }

  .app-header__actions {
    gap: 6px;
  }

  .header-secondary-button,
  .header-primary-button {
    padding: 0 10px;
  }
}
</style>
