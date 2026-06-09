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
const hasWarnings = computed(() => props.warnings.length > 0)

async function handleCopy() {
  if (hasBlockingWarnings.value) {
    ui.openModal('preflight')
    return
  }
  if (hasWarnings.value) {
    await copyRenderedHtml(props.renderedHtml)
    ui.showToast('已复制（存在提醒项，请检查预检提示）', 'error')
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
        <h1 class="app-header__title">
          公众号排版渲染
        </h1>
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
          class="h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-[13px] font-medium bg-surface text-text border border-border hover:bg-surface-hover active:scale-[0.96] transition-all inline-flex items-center justify-center gap-1.5"
          title="导出 HTML"
          @click="handleExport"
        >
          <AppIcon name="download" :size="14" />
          <span class="hidden sm:inline">导出</span>
        </button>
        <button
          type="button"
          class="h-9 w-10 sm:w-auto sm:px-4 rounded-xl text-[13px] font-semibold bg-[#18181b] !text-white border border-[#18181b] hover:bg-[#27272a] hover:border-[#27272a] active:scale-[0.96] transition-all inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          style="color: #ffffff"
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
  background: rgb(255 255 255 / 0.88);
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
  font-size: 18px;
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__stats {
  align-items: center;
  gap: 4px;
  justify-self: center;
  color: var(--color-text-tertiary);
  background: rgb(244 244 245 / 0.72);
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

@media (max-width: 767px) {
  .app-header__inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding: 0 12px;
  }

  .app-header__title {
    font-size: 16px;
  }

  .app-header__actions {
    gap: 6px;
  }
}
</style>
